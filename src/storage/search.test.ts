import { describe, expect, it } from 'vitest'
import type { Node } from '@/domain/types'
import { searchNodes } from './search'

function file(partial: Partial<Node> & Pick<Node, 'id' | 'name'>): Node {
  return {
    dataroomId: 'r1',
    parentId: null,
    type: 'file',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

describe('searchNodes', () => {
  it('matches filename first', () => {
    const nodes = [file({ id: 'a', name: 'budget-2024.pdf' })]
    const hits = searchNodes(nodes, new Map([['a', 'unrelated body']]), 'budget')
    expect(hits).toHaveLength(1)
    expect(hits[0].match).toBe('name')
  })

  it('matches PDF text with snippet', () => {
    const nodes = [file({ id: 'a', name: 'memo.pdf' })]
    const text = 'Acme Corp diligence pack includes indemnification clause'
    const hits = searchNodes(nodes, new Map([['a', text]]), 'indemnification')
    expect(hits).toHaveLength(1)
    expect(hits[0].match).toBe('content')
    expect(hits[0].snippet.toLowerCase()).toContain('indemnification')
  })

  it('returns empty for blank query', () => {
    expect(searchNodes([file({ id: 'a', name: 'x.pdf' })], new Map(), '  ')).toEqual(
      [],
    )
  })
})
