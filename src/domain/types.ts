export type Id = string

export interface DataRoom {
  id: Id
  name: string
  createdAt: number
}

export type NodeType = 'folder' | 'file'

export interface Node {
  id: Id
  dataroomId: Id
  parentId: Id | null
  /** IndexedDB compound index helper; API still uses parentId */
  parentKey?: string
  type: NodeType
  name: string
  mimeType?: 'application/pdf'
  size?: number
  blobKey?: string
  createdAt: number
  updatedAt: number
}

export const ROOT_KEY = 'root'

export function parentKeyOf(parentId: Id | null): string {
  return parentId ?? ROOT_KEY
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
