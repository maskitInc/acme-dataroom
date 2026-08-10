import { collectDescendants, wouldCreateCycle } from '@/domain/cascade'
import { uniqueName } from '@/domain/naming'
import { extractPdfText } from '@/domain/pdfText'
import type { DataRoom, Id, Node, SearchHit } from '@/domain/types'
import { parentKeyOf, ValidationError } from '@/domain/types'
import { validatePdf } from '@/domain/validatePdf'
import type { DataRoomRepository } from './repository'
import { searchNodes } from './search'

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

export class MemoryRepository implements DataRoomRepository {
  private rooms = new Map<Id, DataRoom>()
  private nodes = new Map<Id, Node>()
  private blobs = new Map<Id, Blob>()
  private texts = new Map<Id, string>()

  async listRooms(): Promise<DataRoom[]> {
    return [...this.rooms.values()].sort((a, b) => b.createdAt - a.createdAt)
  }

  async createRoom(name: string): Promise<DataRoom> {
    const trimmed = name.trim()
    if (!trimmed) throw new ValidationError('Name cannot be empty')
    const room: DataRoom = { id: newId(), name: trimmed, createdAt: now() }
    this.rooms.set(room.id, room)
    return room
  }

  async deleteRoom(id: Id): Promise<void> {
    const roomNodes = [...this.nodes.values()].filter((n) => n.dataroomId === id)
    for (const n of roomNodes) {
      if (n.type === 'file' && n.blobKey) this.blobs.delete(n.blobKey)
      this.texts.delete(n.id)
      this.nodes.delete(n.id)
    }
    this.rooms.delete(id)
  }

  async listChildren(dataroomId: Id, parentId: Id | null): Promise<Node[]> {
    const children = [...this.nodes.values()].filter(
      (n) => n.dataroomId === dataroomId && n.parentId === parentId,
    )
    return sortChildren(children)
  }

  async getNode(id: Id): Promise<Node | null> {
    return this.nodes.get(id) ?? null
  }

  async getBreadcrumbs(dataroomId: Id, folderId: Id | null): Promise<Node[]> {
    if (!folderId) return []
    const chain: Node[] = []
    let cur: Id | null = folderId
    const guard = new Set<Id>()
    while (cur) {
      if (guard.has(cur)) break
      guard.add(cur)
      const node = this.nodes.get(cur)
      if (!node || node.dataroomId !== dataroomId) break
      chain.unshift(node)
      cur = node.parentId
    }
    return chain
  }

  private siblingNames(
    dataroomId: Id,
    parentId: Id | null,
    excludeId?: Id,
  ): string[] {
    return [...this.nodes.values()]
      .filter(
        (n) =>
          n.dataroomId === dataroomId &&
          n.parentId === parentId &&
          n.id !== excludeId,
      )
      .map((n) => n.name)
  }

  async createFolder(
    dataroomId: Id,
    parentId: Id | null,
    name: string,
  ): Promise<Node> {
    if (!this.rooms.has(dataroomId)) throw new ValidationError('Room not found')
    if (parentId) {
      const parent = this.nodes.get(parentId)
      if (!parent || parent.type !== 'folder' || parent.dataroomId !== dataroomId) {
        throw new ValidationError('Invalid parent folder')
      }
    }
    const finalName = uniqueName(name, this.siblingNames(dataroomId, parentId))
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
    this.nodes.set(node.id, node)
    return node
  }

  async renameNode(id: Id, name: string): Promise<Node> {
    const node = this.nodes.get(id)
    if (!node) throw new ValidationError('Not found')
    const finalName = uniqueName(
      name,
      this.siblingNames(node.dataroomId, node.parentId, id),
    )
    const updated = { ...node, name: finalName, updatedAt: now() }
    this.nodes.set(id, updated)
    return updated
  }

  async deleteFolder(id: Id): Promise<void> {
    const folder = this.nodes.get(id)
    if (!folder || folder.type !== 'folder') {
      throw new ValidationError('Folder not found')
    }
    const all = [...this.nodes.values()].filter(
      (n) => n.dataroomId === folder.dataroomId,
    )
    const desc = collectDescendants(id, all)
    for (const nid of [...desc, id]) {
      const n = this.nodes.get(nid)
      if (n?.type === 'file' && n.blobKey) this.blobs.delete(n.blobKey)
      this.texts.delete(nid)
      this.nodes.delete(nid)
    }
  }

  async uploadFile(
    dataroomId: Id,
    parentId: Id | null,
    file: File,
  ): Promise<{ node: Node; renamedFrom?: string }> {
    if (!this.rooms.has(dataroomId)) throw new ValidationError('Room not found')
    const check = validatePdf(file)
    if (!check.ok) throw new ValidationError(check.reason)
    if (parentId) {
      const parent = this.nodes.get(parentId)
      if (!parent || parent.type !== 'folder') {
        throw new ValidationError('Invalid parent folder')
      }
    }
    const desired = file.name
    const finalName = uniqueName(desired, this.siblingNames(dataroomId, parentId))
    const id = newId()
    const t = now()
    let hasTextIndex = false
    try {
      const text = await extractPdfText(file)
      if (text.trim()) {
        this.texts.set(id, text)
        hasTextIndex = true
      }
    } catch {
      // indexing best-effort
    }
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
    this.blobs.set(id, file)
    this.nodes.set(id, node)
    return {
      node,
      renamedFrom: finalName !== desired.trim() ? desired.trim() : undefined,
    }
  }

  async getFileBlob(id: Id): Promise<Blob> {
    const blob = this.blobs.get(id)
    if (!blob) throw new ValidationError('File content missing')
    return blob
  }

  async deleteFile(id: Id): Promise<void> {
    const node = this.nodes.get(id)
    if (!node || node.type !== 'file') throw new ValidationError('File not found')
    if (node.blobKey) this.blobs.delete(node.blobKey)
    this.texts.delete(id)
    this.nodes.delete(id)
  }

  async searchInRoom(dataroomId: Id, query: string): Promise<SearchHit[]> {
    const nodes = [...this.nodes.values()].filter((n) => n.dataroomId === dataroomId)
    return searchNodes(nodes, this.texts, query)
  }

  async moveNode(id: Id, newParentId: Id | null): Promise<Node> {
    const node = this.nodes.get(id)
    if (!node) throw new ValidationError('Not found')
    if (newParentId) {
      const parent = this.nodes.get(newParentId)
      if (!parent || parent.type !== 'folder' || parent.dataroomId !== node.dataroomId) {
        throw new ValidationError('Invalid destination')
      }
    }
    if (wouldCreateCycle(id, newParentId, this.nodes)) {
      throw new ValidationError('Cannot move a folder into itself or a descendant')
    }
    const finalName = uniqueName(
      node.name,
      this.siblingNames(node.dataroomId, newParentId, id),
    )
    const updated: Node = {
      ...node,
      parentId: newParentId,
      parentKey: parentKeyOf(newParentId),
      name: finalName,
      updatedAt: now(),
    }
    this.nodes.set(id, updated)
    return updated
  }

  async seedSample(): Promise<DataRoom> {
    const room = await this.createRoom('Sample Diligence Room')
    const legal = await this.createFolder(room.id, null, 'Legal')
    await this.createFolder(room.id, legal.id, 'Contracts')
    await this.createFolder(room.id, null, 'Finance')
    return room
  }
}
