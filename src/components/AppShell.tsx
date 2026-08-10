import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import type { DataRoom, Id, Node } from '@/domain/types'
import { ValidationError } from '@/domain/types'
import { collectDescendants } from '@/domain/cascade'
import { useRepo } from '@/lib/repo-context'
import { readNavFromUrl, writeNavToUrl } from '@/lib/navState'
import { Button } from '@/components/ui/button'
import { DataRoomList } from '@/components/rooms/DataRoomList'
import { RoomBrowser } from '@/components/browser/RoomBrowser'

export function AppShell({
  persistenceDegraded,
  cloudMode = false,
  userEmail = null,
  onSignOut,
}: {
  persistenceDegraded: boolean
  cloudMode?: boolean
  userEmail?: string | null
  onSignOut?: () => Promise<void>
}) {
  const repo = useRepo()
  const initialNav = useRef(readNavFromUrl())
  const [rooms, setRooms] = useState<DataRoom[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [currentRoomId, setCurrentRoomId] = useState<Id | null>(
    initialNav.current.roomId,
  )
  const [currentParentId, setCurrentParentId] = useState<Id | null>(
    initialNav.current.folderId,
  )
  const [roomNodes, setRoomNodes] = useState<Node[]>([])
  const [crumbs, setCrumbs] = useState<Node[]>([])
  const [loadingChildren, setLoadingChildren] = useState(false)
  const [navValidated, setNavValidated] = useState(!initialNav.current.roomId)
  const skipUrlWrite = useRef(true)

  const currentRoom = rooms.find((r) => r.id === currentRoomId) ?? null

  function goHome(mode: 'replace' | 'push' = 'push') {
    setCurrentRoomId(null)
    setCurrentParentId(null)
    writeNavToUrl({ roomId: null, folderId: null }, mode)
  }

  function openRoom(id: Id, mode: 'replace' | 'push' = 'push') {
    setCurrentRoomId(id)
    setCurrentParentId(null)
    writeNavToUrl({ roomId: id, folderId: null }, mode)
  }

  function openFolder(folderId: Id | null, mode: 'replace' | 'push' = 'push') {
    setCurrentParentId(folderId)
    if (currentRoomId) {
      writeNavToUrl({ roomId: currentRoomId, folderId }, mode)
    }
  }

  async function refreshRooms() {
    setLoadingRooms(true)
    try {
      setRooms(await repo.listRooms())
    } finally {
      setLoadingRooms(false)
    }
  }

  async function refreshBrowser(roomId: Id, parentId: Id | null) {
    setLoadingChildren(true)
    try {
      const [nodes, bread] = await Promise.all([
        repo.listRoomNodes(roomId),
        repo.getBreadcrumbs(roomId, parentId),
      ])
      setRoomNodes(nodes)
      setCrumbs(bread)
    } finally {
      setLoadingChildren(false)
    }
  }

  useEffect(() => {
    void refreshRooms()
  }, [repo])

  // Restore / validate URL location after rooms are known
  useEffect(() => {
    if (loadingRooms) return
    let cancelled = false
    void (async () => {
      if (!currentRoomId) {
        if (!cancelled) setNavValidated(true)
        return
      }
      const roomOk = rooms.some((r) => r.id === currentRoomId)
      if (!roomOk) {
        if (!cancelled) {
          skipUrlWrite.current = true
          setCurrentRoomId(null)
          setCurrentParentId(null)
          writeNavToUrl({ roomId: null, folderId: null }, 'replace')
          setNavValidated(true)
        }
        return
      }
      if (currentParentId) {
        const node = await repo.getNode(currentParentId)
        if (
          cancelled ||
          !node ||
          node.type !== 'folder' ||
          node.dataroomId !== currentRoomId
        ) {
          if (!cancelled) {
            skipUrlWrite.current = true
            setCurrentParentId(null)
            writeNavToUrl({ roomId: currentRoomId, folderId: null }, 'replace')
          }
        }
      }
      if (!cancelled) setNavValidated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [loadingRooms, rooms, currentRoomId, currentParentId, repo])

  // Keep URL in sync when state changes (after first paint / restore)
  useEffect(() => {
    if (skipUrlWrite.current) {
      skipUrlWrite.current = false
      return
    }
    writeNavToUrl(
      { roomId: currentRoomId, folderId: currentParentId },
      'replace',
    )
  }, [currentRoomId, currentParentId])

  // Browser back / forward
  useEffect(() => {
    function onPopState() {
      const nav = readNavFromUrl()
      skipUrlWrite.current = true
      setCurrentRoomId(nav.roomId)
      setCurrentParentId(nav.folderId)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (currentRoomId && navValidated) {
      void refreshBrowser(currentRoomId, currentParentId)
    }
  }, [currentRoomId, currentParentId, repo, navValidated])

  function errMsg(e: unknown): string {
    if (e instanceof ValidationError) return e.message
    if (e instanceof Error) return e.message
    return 'Something went wrong'
  }

  async function handleCreateRoom(name: string) {
    try {
      const room = await repo.createRoom(name)
      await refreshRooms()
      toast.success(`Created “${room.name}”`)
      openRoom(room.id)
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function handleSeed() {
    try {
      const room = await repo.seedSample()
      await refreshRooms()
      toast.success('Sample Data Room ready')
      openRoom(room.id)
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function handleDeleteRoom(id: Id) {
    try {
      await repo.deleteRoom(id)
      if (currentRoomId === id) goHome('replace')
      await refreshRooms()
      toast.success('Data Room deleted')
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function mutateAndRefresh(fn: () => Promise<void>) {
    if (!currentRoomId) return
    try {
      await fn()
      await refreshBrowser(currentRoomId, currentParentId)
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  if (currentRoomId && (!navValidated || loadingRooms || !currentRoom)) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!currentRoomId || !currentRoom) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-8">
        {persistenceDegraded && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Storage unavailable — data lasts until you close the tab.
          </div>
        )}
        {cloudMode && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Cloud · signed in as{' '}
              <span className="text-foreground">{userEmail ?? 'user'}</span>
            </span>
            {onSignOut && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void onSignOut().catch((e) =>
                    toast.error(e instanceof Error ? e.message : 'Sign out failed'),
                  )
                }
              >
                <LogOut /> Sign out
              </Button>
            )}
          </div>
        )}
        <header className="mb-8 text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Acme Data Room
          </h1>
          <p className="mt-1 text-muted-foreground">
            Virtual data room for due diligence documents
          </p>
        </header>
        <DataRoomList
          rooms={rooms}
          loading={loadingRooms}
          onCreate={handleCreateRoom}
          onOpen={(id) => openRoom(id)}
          onDelete={handleDeleteRoom}
          onSeed={handleSeed}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-4 py-6">
      {persistenceDegraded && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Storage unavailable — data lasts until you close the tab.
        </div>
      )}
      {cloudMode && onSignOut && (
        <div className="mb-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void onSignOut().catch((e) =>
                toast.error(e instanceof Error ? e.message : 'Sign out failed'),
              )
            }
          >
            <LogOut /> Sign out
          </Button>
        </div>
      )}
      <RoomBrowser
        room={currentRoom}
        parentId={currentParentId}
        crumbs={crumbs}
        roomNodes={roomNodes}
        loading={loadingChildren}
        onBackHome={() => goHome()}
        onNavigate={(folderId) => openFolder(folderId)}
        onCreateFolder={(name) =>
          mutateAndRefresh(async () => {
            await repo.createFolder(currentRoomId, currentParentId, name)
            toast.success('Folder created')
          })
        }
        onRename={(id, name) =>
          mutateAndRefresh(async () => {
            await repo.renameNode(id, name)
            toast.success('Renamed')
          })
        }
        onDeleteFolder={(id, name, n) =>
          mutateAndRefresh(async () => {
            await repo.deleteFolder(id)
            if (currentParentId) {
              const stillThere = await repo.getNode(currentParentId)
              if (
                !stillThere ||
                stillThere.type !== 'folder' ||
                stillThere.dataroomId !== currentRoomId
              ) {
                openFolder(null, 'replace')
              }
            }
            toast.success(`Deleted “${name}” (${n} items inside)`)
          })
        }
        onDeleteFile={(id, name) =>
          mutateAndRefresh(async () => {
            await repo.deleteFile(id)
            toast.success(`Deleted “${name}”`)
          })
        }
        onUpload={async (file, onProgress) => {
          if (!currentRoomId) return
          try {
            const { node, renamedFrom } = await repo.uploadFile(
              currentRoomId,
              currentParentId,
              file,
              onProgress,
            )
            await refreshBrowser(currentRoomId, currentParentId)
            if (renamedFrom) {
              toast.message(`Saved as “${node.name}”`)
            } else {
              toast.success('PDF uploaded')
            }
          } catch (e) {
            toast.error(errMsg(e))
          }
        }}
        onMove={(id, newParentId) =>
          mutateAndRefresh(async () => {
            await repo.moveNode(id, newParentId)
            toast.success('Moved')
          })
        }
        getFileBlob={(id) => repo.getFileBlob(id)}
        onSearch={(q) => repo.searchInRoom(currentRoomId, q)}
        countDescendants={async (folderId) =>
          collectDescendants(folderId, roomNodes).length
        }
      />
    </div>
  )
}
