import type { Id } from '@/domain/types'

export type NavLocation = {
  roomId: Id | null
  folderId: Id | null
}

/** Read room/folder from ?room=&folder= (query, not hash — hash reserved for Supabase auth). */
export function readNavFromUrl(
  search = typeof window !== 'undefined' ? window.location.search : '',
): NavLocation {
  const params = new URLSearchParams(search)
  const roomId = params.get('room')?.trim() || null
  const folderId = params.get('folder')?.trim() || null
  return {
    roomId,
    folderId: roomId ? folderId : null,
  }
}

export function writeNavToUrl(
  loc: NavLocation,
  mode: 'replace' | 'push' = 'replace',
): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (loc.roomId) url.searchParams.set('room', loc.roomId)
  else url.searchParams.delete('room')
  if (loc.roomId && loc.folderId) url.searchParams.set('folder', loc.folderId)
  else url.searchParams.delete('folder')

  const next = `${url.pathname}${url.search}${url.hash}`
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next === cur) return
  if (mode === 'push') window.history.pushState(null, '', next)
  else window.history.replaceState(null, '', next)
}
