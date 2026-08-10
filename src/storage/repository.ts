import type { DataRoom, Id, Node, SearchHit, UploadProgress } from '@/domain/types'

export type UploadProgressHandler = (progress: UploadProgress) => void

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
    onProgress?: UploadProgressHandler,
  ): Promise<{ node: Node; renamedFrom?: string }>
  getFileBlob(id: Id): Promise<Blob>
  deleteFile(id: Id): Promise<void>

  moveNode(id: Id, newParentId: Id | null): Promise<Node>

  /** Room-wide search by filename and/or PDF text index */
  searchInRoom(dataroomId: Id, query: string): Promise<SearchHit[]>

  seedSample(): Promise<DataRoom>
}
