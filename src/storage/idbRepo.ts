import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { collectDescendants, wouldCreateCycle } from '@/domain/cascade'
import { uniqueName } from '@/domain/naming'
import { extractPdfText } from '@/domain/pdfText'
import type { DataRoom, Id, Node, SearchHit, UploadProgress } from '@/domain/types'
import { parentKeyOf, ValidationError } from '@/domain/types'
import { validatePdf } from '@/domain/validatePdf'
import type { DataRoomRepository } from './repository'
import { searchNodes } from './search'

interface AcmeDB extends DBSchema {
  datarooms: {
    key: string
    value: DataRoom
    indexes: { byCreatedAt: number }
  }
  nodes: {
    key: string
    value: Node
    indexes: {
      byRoom: string
      byParent: [string, string]
      byName: [string, string, string]
    }
  }
  blobs: {
    key: string
    value: { id: string; blob: Blob }
  }
  texts: {
    key: string
    value: { id: string; text: string }
  }
}

const DB_NAME = 'acme-dataroom'
const DB_VERSION = 2

function newId(): Id {
  return crypto.randomUUID()
}

function now(): number {
  return Date.now()
}

function sortChildren(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

async function openAcmeDb(): Promise<IDBPDatabase<AcmeDB>> {
  return openDB<AcmeDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const rooms = db.createObjectStore('datarooms', { keyPath: 'id' })
        rooms.createIndex('byCreatedAt', 'createdAt')
        const nodes = db.createObjectStore('nodes', { keyPath: 'id' })
        nodes.createIndex('byRoom', 'dataroomId')
        nodes.createIndex('byParent', ['dataroomId', 'parentKey'])
        nodes.createIndex('byName', ['dataroomId', 'parentKey', 'name'])
        db.createObjectStore('blobs', { keyPath: 'id' })
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains('texts')) {
        db.createObjectStore('texts', { keyPath: 'id' })
      }
    },
  })
}

export class IdbRepository implements DataRoomRepository {
  private db: IDBPDatabase<AcmeDB>

  constructor(db: IDBPDatabase<AcmeDB>) {
    this.db = db
  }

  async listRooms(): Promise<DataRoom[]> {
    const rooms = await this.db.getAll('datarooms')
    return rooms.sort((a, b) => b.createdAt - a.createdAt)
  }

  async createRoom(name: string): Promise<DataRoom> {
    const trimmed = name.trim()
    if (!trimmed) throw new ValidationError('Name cannot be empty')
    const room: DataRoom = { id: newId(), name: trimmed, createdAt: now() }
    await this.db.put('datarooms', room)
    return room
  }

  async deleteRoom(id: Id): Promise<void> {
    const tx = this.db.transaction(
      ['nodes', 'blobs', 'texts', 'datarooms'],
      'readwrite',
    )
    const roomNodes = await tx.objectStore('nodes').index('byRoom').getAll(id)
    for (const n of roomNodes) {
      if (n.type === 'file' && n.blobKey) await tx.objectStore('blobs').delete(n.blobKey)
      await tx.objectStore('texts').delete(n.id)
      await tx.objectStore('nodes').delete(n.id)
    }
    await tx.objectStore('datarooms').delete(id)
    await tx.done
  }

  async listChildren(dataroomId: Id, parentId: Id | null): Promise<Node[]> {
    const key = parentKeyOf(parentId)
    const children = await this.db.getAllFromIndex('nodes', 'byParent', [
      dataroomId,
      key,
    ])
    return sortChildren(children)
  }

  async getNode(id: Id): Promise<Node | null> {
    return (await this.db.get('nodes', id)) ?? null
  }

  async getBreadcrumbs(dataroomId: Id, folderId: Id | null): Promise<Node[]> {
    if (!folderId) return []
    const chain: Node[] = []
    let cur: Id | null = folderId
    const guard = new Set<Id>()
    while (cur) {
      if (guard.has(cur)) break
      guard.add(cur)
      const node: Node | undefined = await this.db.get('nodes', cur)
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
    return this.db.getAllFromIndex('nodes', 'byRoom', dataroomId)
  }

  async listRoomNodes(dataroomId: Id): Promise<Node[]> {
    return this.allRoomNodes(dataroomId)
  }

  async createFolder(
    dataroomId: Id,
    parentId: Id | null,
    name: string,
  ): Promise<Node> {
    const room = await this.db.get('datarooms', dataroomId)
    if (!room) throw new ValidationError('Room not found')
    if (parentId) {
      const parent = await this.db.get('nodes', parentId)
      if (!parent || parent.type !== 'folder' || parent.dataroomId !== dataroomId) {
        throw new ValidationError('Invalid parent folder')
      }
    }
    const finalName = uniqueName(
      name,
      await this.siblingNames(dataroomId, parentId),
    )
    const t = now()
    const node: Node = {
      id: newId(),
      dataroomId,
      parentId,
      parentKey: parentKeyOf(parentId),
      type: 'folder',
      name: finalName,
      createdAt: t,
      updatedAt: t,
    }
    await this.db.put('nodes', node)
    return node
  }

  async renameNode(id: Id, name: string): Promise<Node> {
    const node = await this.db.get('nodes', id)
    if (!node) throw new ValidationError('Not found')
    const finalName = uniqueName(
      name,
      await this.siblingNames(node.dataroomId, node.parentId, id),
    )
    const updated = { ...node, name: finalName, updatedAt: now() }
    await this.db.put('nodes', updated)
    return updated
  }

  async deleteFolder(id: Id): Promise<void> {
    const folder = await this.db.get('nodes', id)
    if (!folder || folder.type !== 'folder') {
      throw new ValidationError('Folder not found')
    }
    const all = await this.allRoomNodes(folder.dataroomId)
    const desc = collectDescendants(id, all)
    const tx = this.db.transaction(['nodes', 'blobs', 'texts'], 'readwrite')
    for (const nid of [...desc, id]) {
      const n = all.find((x) => x.id === nid) ?? (await tx.objectStore('nodes').get(nid))
      if (n?.type === 'file' && n.blobKey) {
        await tx.objectStore('blobs').delete(n.blobKey)
      }
      await tx.objectStore('texts').delete(nid)
      await tx.objectStore('nodes').delete(nid)
    }
    await tx.done
  }

  async uploadFile(
    dataroomId: Id,
    parentId: Id | null,
    file: File,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<{ node: Node; renamedFrom?: string }> {
    const report = onProgress ?? (() => {})
    report({ phase: 'validate', percent: 2, label: 'Validating…' })
    const room = await this.db.get('datarooms', dataroomId)
    if (!room) throw new ValidationError('Room not found')
    const check = validatePdf(file)
    if (!check.ok) throw new ValidationError(check.reason)
    if (parentId) {
      const parent = await this.db.get('nodes', parentId)
      if (!parent || parent.type !== 'folder') {
        throw new ValidationError('Invalid parent folder')
      }
    }
    report({ phase: 'validate', percent: 5, label: 'Validating…' })
    const desired = file.name
    const finalName = uniqueName(
      desired,
      await this.siblingNames(dataroomId, parentId),
    )
    const id = newId()
    const t = now()
    let text = ''
    let hasTextIndex = false
    report({ phase: 'extract', percent: 10, label: 'Indexing PDF text…' })
    try {
      text = await extractPdfText(file)
      hasTextIndex = text.trim().length > 0
    } catch {
      // best-effort
    }
    report({ phase: 'extract', percent: 35, label: 'Indexing PDF text…' })
    const node: Node = {
      id,
      dataroomId,
      parentId,
      parentKey: parentKeyOf(parentId),
      type: 'file',
      name: finalName,
      mimeType: 'application/pdf',
      size: file.size,
      blobKey: id,
      hasTextIndex,
      createdAt: t,
      updatedAt: t,
    }
    report({
      phase: 'store',
      percent: 50,
      bytesLoaded: 0,
      bytesTotal: file.size,
      label: 'Saving locally…',
    })
    const tx = this.db.transaction(['nodes', 'blobs', 'texts'], 'readwrite')
    await tx.objectStore('blobs').put({ id, blob: file })
    await tx.objectStore('nodes').put(node)
    if (hasTextIndex) await tx.objectStore('texts').put({ id, text })
    await tx.done
    report({
      phase: 'store',
      percent: 90,
      bytesLoaded: file.size,
      bytesTotal: file.size,
      label: 'Saving locally…',
    })
    report({ phase: 'finalize', percent: 100, label: 'Done' })
    return {
      node,
      renamedFrom: finalName !== desired.trim() ? desired.trim() : undefined,
    }
  }

  async getFileBlob(id: Id): Promise<Blob> {
    const row = await this.db.get('blobs', id)
    if (!row) throw new ValidationError('File content missing')
    return row.blob
  }

  async deleteFile(id: Id): Promise<void> {
    const node = await this.db.get('nodes', id)
    if (!node || node.type !== 'file') throw new ValidationError('File not found')
    const tx = this.db.transaction(['nodes', 'blobs', 'texts'], 'readwrite')
    if (node.blobKey) await tx.objectStore('blobs').delete(node.blobKey)
    await tx.objectStore('texts').delete(id)
    await tx.objectStore('nodes').delete(id)
    await tx.done
  }

  async moveNode(id: Id, newParentId: Id | null): Promise<Node> {
    const node = await this.db.get('nodes', id)
    if (!node) throw new ValidationError('Not found')
    if (newParentId) {
      const parent = await this.db.get('nodes', newParentId)
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
    const updated: Node = {
      ...node,
      parentId: newParentId,
      parentKey: parentKeyOf(newParentId),
      name: finalName,
      updatedAt: now(),
    }
    await this.db.put('nodes', updated)
    return updated
  }

  async searchInRoom(dataroomId: Id, query: string): Promise<SearchHit[]> {
    const nodes = await this.allRoomNodes(dataroomId)
    const texts = new Map<string, string>()
    for (const n of nodes) {
      if (n.type !== 'file') continue
      const row = await this.db.get('texts', n.id)
      if (row?.text) texts.set(n.id, row.text)
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

export async function createRepository(): Promise<{
  repo: DataRoomRepository
  persistenceDegraded: boolean
}> {
  try {
    const db = await openAcmeDb()
    // smoke write
    await db.getAll('datarooms')
    return { repo: new IdbRepository(db), persistenceDegraded: false }
  } catch {
    const { MemoryRepository } = await import('./memoryRepo')
    return { repo: new MemoryRepository(), persistenceDegraded: true }
  }
}
