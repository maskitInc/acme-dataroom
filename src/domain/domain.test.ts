import { describe, expect, it } from 'vitest'
import { uniqueName } from './naming'
import { collectDescendants, wouldCreateCycle } from './cascade'
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
