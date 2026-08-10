import { describe, expect, it } from 'vitest'
import { uniqueName } from './naming'
import { collectDescendants, wouldCreateCycle } from './cascade'
import {
  blockedMoveFolderIds,
  flattenOutline,
} from './tree'
import type { Node } from './types'
import { validatePdf } from './validatePdf'

describe('uniqueName', () => {
  it('returns desired when free', () => {
    expect(uniqueName('a.pdf', [])).toBe('a.pdf')
  })
  it('suffixes on conflict', () => {
    expect(uniqueName('a.pdf', ['a.pdf'])).toBe('a (1).pdf')
    expect(uniqueName('a.pdf', ['a.pdf', 'a (1).pdf'])).toBe('a (2).pdf')
  })
  it('folders', () => {
    expect(uniqueName('Legal', ['Legal'])).toBe('Legal (1)')
  })
  it('rejects empty', () => {
    expect(() => uniqueName('  ', [])).toThrow()
  })
})

describe('collectDescendants', () => {
  const nodes: Node[] = [
    {
      id: 'A',
      dataroomId: 'r',
      parentId: null,
      type: 'folder',
      name: 'A',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'B',
      dataroomId: 'r',
      parentId: 'A',
      type: 'folder',
      name: 'B',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'C',
      dataroomId: 'r',
      parentId: 'B',
      type: 'file',
      name: 'c.pdf',
      createdAt: 1,
      updatedAt: 1,
    },
  ]
  it('collects nested', () => {
    expect(collectDescendants('A', nodes).sort()).toEqual(['B', 'C'])
  })
})

describe('wouldCreateCycle', () => {
  const nodes: Node[] = [
    {
      id: 'A',
      dataroomId: 'r',
      parentId: null,
      type: 'folder',
      name: 'A',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'B',
      dataroomId: 'r',
      parentId: 'A',
      type: 'folder',
      name: 'B',
      createdAt: 1,
      updatedAt: 1,
    },
  ]
  const map = new Map(nodes.map((n) => [n.id, n]))
  it('blocks into self', () => {
    expect(wouldCreateCycle('A', 'A', map)).toBe(true)
  })
  it('blocks into descendant', () => {
    expect(wouldCreateCycle('A', 'B', map)).toBe(true)
  })
  it('allows root', () => {
    expect(wouldCreateCycle('B', null, map)).toBe(false)
  })
})

describe('validatePdf', () => {
  it('accepts pdf', () => {
    const f = new File(['x'], 'a.pdf', { type: 'application/pdf' })
    expect(validatePdf(f).ok).toBe(true)
  })
  it('rejects png', () => {
    const f = new File(['x'], 'a.png', { type: 'image/png' })
    expect(validatePdf(f).ok).toBe(false)
  })
})

describe('flattenOutline', () => {
  const nodes: Node[] = [
    {
      id: 'F',
      dataroomId: 'r',
      parentId: null,
      type: 'folder',
      name: 'Finance',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'L',
      dataroomId: 'r',
      parentId: null,
      type: 'folder',
      name: 'Legal',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'C',
      dataroomId: 'r',
      parentId: 'L',
      type: 'folder',
      name: 'Contracts',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'p',
      dataroomId: 'r',
      parentId: 'C',
      type: 'file',
      name: 'x.pdf',
      createdAt: 1,
      updatedAt: 1,
    },
  ]

  it('shows only root children when collapsed', () => {
    const rows = flattenOutline(nodes, null, new Set())
    expect(rows.map((r) => r.node.id)).toEqual(['F', 'L'])
    expect(rows.find((r) => r.node.id === 'L')?.hasChildren).toBe(true)
  })

  it('reveals nested when expanded', () => {
    const rows = flattenOutline(nodes, null, new Set(['L', 'C']))
    expect(rows.map((r) => [r.node.id, r.depth])).toEqual([
      ['F', 0],
      ['L', 0],
      ['C', 1],
      ['p', 2],
    ])
  })

  it('foldersOnly skips files', () => {
    const rows = flattenOutline(nodes, null, new Set(['L', 'C']), {
      foldersOnly: true,
    })
    expect(rows.map((r) => r.node.id)).toEqual(['F', 'L', 'C'])
  })
})

describe('blockedMoveFolderIds', () => {
  const nodes: Node[] = [
    {
      id: 'A',
      dataroomId: 'r',
      parentId: null,
      type: 'folder',
      name: 'A',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'B',
      dataroomId: 'r',
      parentId: 'A',
      type: 'folder',
      name: 'B',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'f',
      dataroomId: 'r',
      parentId: 'A',
      type: 'file',
      name: 'f.pdf',
      createdAt: 1,
      updatedAt: 1,
    },
  ]
  it('blocks self and descendant folders', () => {
    expect(
      [...blockedMoveFolderIds(nodes[0]!, nodes)].sort(),
    ).toEqual(['A', 'B'])
  })
  it('empty for files', () => {
    expect(blockedMoveFolderIds(nodes[2]!, nodes).size).toBe(0)
  })
})
