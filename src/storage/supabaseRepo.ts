import type { SupabaseClient, User } from '@supabase/supabase-js'
import { collectDescendants, wouldCreateCycle } from '@/domain/cascade'
import { uniqueName } from '@/domain/naming'
import { extractPdfText } from '@/domain/pdfText'
import type { DataRoom, Id, Node, SearchHit, UploadProgress } from '@/domain/types'
import { parentKeyOf, ValidationError } from '@/domain/types'
import { validatePdf } from '@/domain/validatePdf'
import { uploadStorageObjectWithProgress } from '@/lib/storageUpload'
import type { DataRoomRepository } from './repository'
import { searchNodes } from './search'

type RoomRow = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

type NodeRow = {
  id: string
  dataroom_id: string
  parent_id: string | null
  type: 'folder' | 'file'
  name: string
  mime_type: string | null
  size: number | null
  storage_path: string | null
  has_text_index: boolean
  created_at: string
  updated_at: string
}

function sortChildren(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function mapRoom(row: RoomRow): DataRoom {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
  }
}

function mapNode(row: NodeRow): Node {
  return {
    id: row.id,
    dataroomId: row.dataroom_id,
    parentId: row.parent_id,
    parentKey: parentKeyOf(row.parent_id),
    type: row.type,
    name: row.name,
    mimeType: row.mime_type === 'application/pdf' ? 'application/pdf' : undefined,
    size: row.size ?? undefined,
    blobKey: row.storage_path ?? undefined,
    hasTextIndex: row.has_text_index,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

function storagePath(userId: string, dataroomId: string, nodeId: string): string {
  return `${userId}/${dataroomId}/${nodeId}.pdf`
}

function throwSb(error: { message: string } | null, fallback: string): never {
  throw new ValidationError(error?.message ?? fallback)
}

export class SupabaseRepository implements DataRoomRepository {
  private client: SupabaseClient
  private user: User

  constructor(client: SupabaseClient, user: User) {
    this.client = client
    this.user = user
  }

  private uid(): string {
    return this.user.id
  }

  async listRooms(): Promise<DataRoom[]> {
    const { data, error } = await this.client
      .from('datarooms')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwSb(error, 'Failed to list rooms')
    return (data as RoomRow[]).map(mapRoom)
  }

  async createRoom(name: string): Promise<DataRoom> {
    const trimmed = name.trim()
    if (!trimmed) throw new ValidationError('Name cannot be empty')
    const { data, error } = await this.client
      .from('datarooms')
      .insert({ name: trimmed, owner_id: this.uid() })
      .select('*')
      .single()
    if (error || !data) throwSb(error, 'Failed to create room')
    return mapRoom(data as RoomRow)
  }

  async deleteRoom(id: Id): Promise<void> {
    const files = await this.fileNodesInRoom(id)
    await this.removeStoragePaths(files.map((f) => f.storage_path).filter(Boolean) as string[])
    const { error } = await this.client.from('datarooms').delete().eq('id', id)
    if (error) throwSb(error, 'Failed to delete room')
  }

  async listChildren(dataroomId: Id, parentId: Id | null): Promise<Node[]> {
    let q = this.client.from('nodes').select('*').eq('dataroom_id', dataroomId)
    q = parentId == null ? q.is('parent_id', null) : q.eq('parent_id', parentId)
    const { data, error } = await q
    if (error) throwSb(error, 'Failed to list children')
    return sortChildren((data as NodeRow[]).map(mapNode))
  }

  async getNode(id: Id): Promise<Node | null> {
    const { data, error } = await this.client.from('nodes').select('*').eq('id', id).maybeSingle()
    if (error) throwSb(error, 'Failed to get node')
    return data ? mapNode(data as NodeRow) : null
  }

  async getBreadcrumbs(dataroomId: Id, folderId: Id | null): Promise<Node[]> {
    if (!folderId) return []
    const chain: Node[] = []
    let cur: Id | null = folderId
    const guard = new Set<Id>()
    while (cur) {
      if (guard.has(cur)) break
      guard.add(cur)
      const node = await this.getNode(cur)
      if (!node || node.dataroomId !== dataroomId) break
      chain.unshift(node)
      cur = node.parentId
    }
    return chain
  }

  private async siblingNames(
    dataroomId: Id,
    parentId: Id | null,
    excludeId?: Id,
  ): Promise<string[]> {
    const children = await this.listChildren(dataroomId, parentId)
    return children.filter((n) => n.id !== excludeId).map((n) => n.name)
  }

  private async allRoomNodes(dataroomId: Id): Promise<Node[]> {
    const { data, error } = await this.client
      .from('nodes')
      .select('*')
      .eq('dataroom_id', dataroomId)
    if (error) throwSb(error, 'Failed to load room nodes')
    return (data as NodeRow[]).map(mapNode)
  }

  private async fileNodesInRoom(dataroomId: Id): Promise<NodeRow[]> {
    const { data, error } = await this.client
      .from('nodes')
      .select('*')
      .eq('dataroom_id', dataroomId)
      .eq('type', 'file')
    if (error) throwSb(error, 'Failed to list files')
    return data as NodeRow[]
  }

  private async removeStoragePaths(paths: string[]): Promise<void> {
    if (paths.length === 0) return
    const { error } = await this.client.storage.from('dataroom-files').remove(paths)
    if (error) {
      // best-effort cleanup; metadata delete still proceeds
      console.warn('storage remove', error.message)
    }
  }

  async createFolder(
    dataroomId: Id,
    parentId: Id | null,
    name: string,
  ): Promise<Node> {
    if (parentId) {
      const parent = await this.getNode(parentId)
      if (!parent || parent.type !== 'folder' || parent.dataroomId !== dataroomId) {
        throw new ValidationError('Invalid parent folder')
      }
    }
    const finalName = uniqueName(name, await this.siblingNames(dataroomId, parentId))
    const { data, error } = await this.client
      .from('nodes')
      .insert({
        dataroom_id: dataroomId,
        parent_id: parentId,
        type: 'folder',
        name: finalName,
      })
      .select('*')
      .single()
    if (error || !data) throwSb(error, 'Failed to create folder')
    return mapNode(data as NodeRow)
  }

  async renameNode(id: Id, name: string): Promise<Node> {
    const node = await this.getNode(id)
    if (!node) throw new ValidationError('Not found')
    const finalName = uniqueName(
      name,
      await this.siblingNames(node.dataroomId, node.parentId, id),
    )
    const { data, error } = await this.client
      .from('nodes')
      .update({ name: finalName, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error || !data) throwSb(error, 'Failed to rename')
    return mapNode(data as NodeRow)
  }

  async deleteFolder(id: Id): Promise<void> {
    const folder = await this.getNode(id)
    if (!folder || folder.type !== 'folder') throw new ValidationError('Folder not found')
    const all = await this.allRoomNodes(folder.dataroomId)
    const desc = collectDescendants(id, all)
    const ids = [...desc, id]
    const paths = all
      .filter((n) => ids.includes(n.id) && n.type === 'file' && n.blobKey)
      .map((n) => n.blobKey!)
    await this.removeStoragePaths(paths)
    const { error } = await this.client.from('nodes').delete().eq('id', id)
    if (error) throwSb(error, 'Failed to delete folder')
  }

  async uploadFile(
    dataroomId: Id,
    parentId: Id | null,
    file: File,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<{ node: Node; renamedFrom?: string }> {
    const report = onProgress ?? (() => {})
    report({ phase: 'validate', percent: 2, label: 'Validating…' })
    const check = validatePdf(file)
    if (!check.ok) throw new ValidationError(check.reason)
    if (parentId) {
      const parent = await this.getNode(parentId)
      if (!parent || parent.type !== 'folder' || parent.dataroomId !== dataroomId) {
        throw new ValidationError('Invalid parent folder')
      }
    }
    report({ phase: 'validate', percent: 5, label: 'Validating…' })
    const desired = file.name
    const finalName = uniqueName(desired, await this.siblingNames(dataroomId, parentId))
    const nodeId = crypto.randomUUID()
    const path = storagePath(this.uid(), dataroomId, nodeId)

    let text = ''
    let hasTextIndex = false
    report({ phase: 'extract', percent: 8, label: 'Indexing PDF text…' })
    try {
      text = await extractPdfText(file)
      hasTextIndex = text.trim().length > 0
    } catch {
      // best-effort
    }
    report({ phase: 'extract', percent: 22, label: 'Indexing PDF text…' })

    const {
      data: { session },
      error: sessionErr,
    } = await this.client.auth.getSession()
    if (sessionErr || !session?.access_token) {
      throw new ValidationError('Not signed in')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

    report({
      phase: 'store',
      percent: 25,
      bytesLoaded: 0,
      bytesTotal: file.size,
      label: 'Uploading…',
    })

    try {
      await uploadStorageObjectWithProgress({
        supabaseUrl,
        apikey,
        accessToken: session.access_token,
        bucket: 'dataroom-files',
        path,
        file,
        contentType: 'application/pdf',
        onProgress: (loaded, total) => {
          const ratio = total > 0 ? loaded / total : 0
          const percent = Math.round(25 + ratio * 65)
          report({
            phase: 'store',
            percent,
            bytesLoaded: loaded,
            bytesTotal: total,
            label: 'Uploading…',
          })
        },
      })
    } catch (err) {
      throw new ValidationError(
        err instanceof Error ? err.message : 'Failed to upload PDF',
      )
    }

    report({ phase: 'finalize', percent: 92, label: 'Saving metadata…' })

    const { data, error } = await this.client
      .from('nodes')
      .insert({
        id: nodeId,
        dataroom_id: dataroomId,
        parent_id: parentId,
        type: 'file',
        name: finalName,
        mime_type: 'application/pdf',
        size: file.size,
        storage_path: path,
        has_text_index: hasTextIndex,
      })
      .select('*')
      .single()

    if (error || !data) {
      await this.removeStoragePaths([path])
      throwSb(error, 'Failed to save file metadata')
    }

    if (hasTextIndex) {
      const { error: textErr } = await this.client
        .from('file_texts')
        .insert({ node_id: nodeId, text })
      if (textErr) console.warn('text index', textErr.message)
    }

    report({ phase: 'finalize', percent: 100, label: 'Done' })
    return {
      node: mapNode(data as NodeRow),
      renamedFrom: finalName !== desired.trim() ? desired.trim() : undefined,
    }
  }

  async getFileBlob(id: Id): Promise<Blob> {
    const node = await this.getNode(id)
    if (!node || node.type !== 'file' || !node.blobKey) {
      throw new ValidationError('File content missing')
    }
    const { data, error } = await this.client.storage
      .from('dataroom-files')
      .download(node.blobKey)
    if (error || !data) throwSb(error, 'File content missing')
    return data
  }

  async deleteFile(id: Id): Promise<void> {
    const node = await this.getNode(id)
    if (!node || node.type !== 'file') throw new ValidationError('File not found')
    if (node.blobKey) await this.removeStoragePaths([node.blobKey])
    const { error } = await this.client.from('nodes').delete().eq('id', id)
    if (error) throwSb(error, 'Failed to delete file')
  }

  async moveNode(id: Id, newParentId: Id | null): Promise<Node> {
    const node = await this.getNode(id)
    if (!node) throw new ValidationError('Not found')
    if (newParentId) {
      const parent = await this.getNode(newParentId)
      if (!parent || parent.type !== 'folder' || parent.dataroomId !== node.dataroomId) {
        throw new ValidationError('Invalid destination')
      }
    }
    const all = await this.allRoomNodes(node.dataroomId)
    const map = new Map(all.map((n) => [n.id, n]))
    if (wouldCreateCycle(id, newParentId, map)) {
      throw new ValidationError('Cannot move a folder into itself or a descendant')
    }
    const finalName = uniqueName(
      node.name,
      await this.siblingNames(node.dataroomId, newParentId, id),
    )
    const { data, error } = await this.client
      .from('nodes')
      .update({
        parent_id: newParentId,
        name: finalName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error || !data) throwSb(error, 'Failed to move')
    return mapNode(data as NodeRow)
  }

  async searchInRoom(dataroomId: Id, query: string): Promise<SearchHit[]> {
    const nodes = await this.allRoomNodes(dataroomId)
    const fileIds = nodes.filter((n) => n.type === 'file').map((n) => n.id)
    const texts = new Map<string, string>()
    if (fileIds.length > 0) {
      const { data, error } = await this.client
        .from('file_texts')
        .select('node_id, text')
        .in('node_id', fileIds)
      if (error) throwSb(error, 'Search failed')
      for (const row of data ?? []) {
        texts.set(row.node_id as string, row.text as string)
      }
    }
    return searchNodes(nodes, texts, query)
  }

  async seedSample(): Promise<DataRoom> {
    const room = await this.createRoom('Sample Diligence Room')
    const legal = await this.createFolder(room.id, null, 'Legal')
    await this.createFolder(room.id, legal.id, 'Contracts')
    await this.createFolder(room.id, null, 'Finance')
    return room
  }
}
