import type { Id, Node } from './types'
import { collectDescendants } from './cascade'

export type OutlineRow = {
  node: Node
  depth: number
  hasChildren: boolean
}

function sortOutlineChildren(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

/** parentId → sorted children */
export function buildChildrenMap(nodes: Node[]): Map<Id | null, Node[]> {
  const map = new Map<Id | null, Node[]>()
  for (const n of nodes) {
    const list = map.get(n.parentId) ?? []
    list.push(n)
    map.set(n.parentId, list)
  }
  for (const [key, list] of map) {
    map.set(key, sortOutlineChildren(list))
  }
  return map
}

/**
 * Flat macOS-style outline rows under `rootParentId`.
 * Expand only reveals nested rows; does not change navigation root.
 */
export function flattenOutline(
  nodes: Node[],
  rootParentId: Id | null,
  expandedIds: ReadonlySet<Id>,
  opts?: { foldersOnly?: boolean },
): OutlineRow[] {
  const byParent = buildChildrenMap(nodes)
  const rows: OutlineRow[] = []

  function walk(parentId: Id | null, depth: number) {
    let kids = byParent.get(parentId) ?? []
    if (opts?.foldersOnly) kids = kids.filter((k) => k.type === 'folder')
    for (const node of kids) {
      const childList = byParent.get(node.id) ?? []
      const nest =
        opts?.foldersOnly
          ? childList.filter((c) => c.type === 'folder')
          : childList
      const hasChildren = node.type === 'folder' && nest.length > 0
      rows.push({ node, depth, hasChildren })
      if (hasChildren && expandedIds.has(node.id)) {
        walk(node.id, depth + 1)
      }
    }
  }

  walk(rootParentId, 0)
  return rows
}

/** Folder ids that must not be Move destinations (self + descendants). */
export function blockedMoveFolderIds(
  moving: Node,
  allNodes: Node[],
): Set<Id> {
  const blocked = new Set<Id>()
  if (moving.type !== 'folder') return blocked
  blocked.add(moving.id)
  for (const id of collectDescendants(moving.id, allNodes)) {
    const n = allNodes.find((x) => x.id === id)
    if (n?.type === 'folder') blocked.add(id)
  }
  return blocked
}
