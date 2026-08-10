import { makeSnippet } from '@/domain/pdfText'
import type { Node, SearchHit } from '@/domain/types'

export function searchNodes(
  nodes: Node[],
  texts: Map<string, string>,
  query: string,
): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []
  for (const node of nodes) {
    if (node.name.toLowerCase().includes(q)) {
      hits.push({ node, match: 'name', snippet: node.name })
      continue
    }
    if (node.type === 'file') {
      const text = texts.get(node.id)
      if (text && text.toLowerCase().includes(q)) {
        hits.push({
          node,
          match: 'content',
          snippet: makeSnippet(text, query),
        })
      }
    }
  }
  return hits
}
