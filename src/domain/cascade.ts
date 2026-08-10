import type { Id, Node } from './types'

/** Descendant ids excluding rootId */
export function collectDescendants(rootId: Id, allNodes: Node[]): Id[] {
  const byParent = new Map<Id | null, Node[]>()
  for (const node of allNodes) {
    const key = node.parentId
    const list = byParent.get(key) ?? []
    list.push(node)
    byParent.set(key, list)
  }

  const result: Id[] = []
  const queue: Id[] = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    const children = byParent.get(id) ?? []
    for (const child of children) {
      result.push(child.id)
      if (child.type === 'folder') queue.push(child.id)
    }
  }
  return result
}

/** True if placing nodeId under newParentId would create a cycle */
export function wouldCreateCycle(
  nodeId: Id,
  newParentId: Id | null,
  nodesById: Map<Id, Node>,
): boolean {
  if (newParentId === null) return false
  if (newParentId === nodeId) return true
  const node = nodesById.get(nodeId)
  if (!node || node.type !== 'folder') return false

  let cur: Id | null = newParentId
  const guard = new Set<Id>()
  while (cur !== null) {
    if (cur === nodeId) return true
    if (guard.has(cur)) return true
    guard.add(cur)
    cur = nodesById.get(cur)?.parentId ?? null
  }
  return false
}
