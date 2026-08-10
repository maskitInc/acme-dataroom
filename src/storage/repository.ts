import type { DataRoom, Id, Node } from '@/domain/types'

export interface DataRoomRepository {
  listRooms(): Promise<DataRoom[]>
  createRoom(name: string): Promise<DataRoom>
  deleteRoom(id: Id): Promise<void>

  listChildren(dataroomId: Id, parentId: Id | null): Promise<Node[]>
  getNode(id: Id): Promise<Node | null>
  getBreadcrumbs(dataroomId: Id, folderId: Id | null): Promise<Node[]>

  createFolder(
    dataroomId: Id,
    parentId: Id | null,
    name: string,
  ): Promise<Node>
  renameNode(id: Id, name: string): Promise<Node>
  deleteFolder(id: Id): Promise<void>

  uploadFile(
    dataroomId: Id,
    parentId: Id | null,
    file: File,
  ): Promise<{ node: Node; renamedFrom?: string }>
  getFileBlob(id: Id): Promise<Blob>
  deleteFile(id: Id): Promise<void>

  moveNode(id: Id, newParentId: Id | null): Promise<Node>

  seedSample(): Promise<DataRoom>
}
