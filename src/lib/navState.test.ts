import { describe, expect, it } from 'vitest'
import { readNavFromUrl } from '@/lib/navState'

describe('navState', () => {
  it('reads room and folder from query', () => {
    expect(readNavFromUrl('?room=r1&folder=f1')).toEqual({
      roomId: 'r1',
      folderId: 'f1',
    })
  })

  it('ignores folder without room', () => {
    expect(readNavFromUrl('?folder=f1')).toEqual({
      roomId: null,
      folderId: null,
    })
  })

  it('handles empty', () => {
    expect(readNavFromUrl('')).toEqual({ roomId: null, folderId: null })
  })
})
