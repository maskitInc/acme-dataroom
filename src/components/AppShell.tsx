import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { DataRoom, Id, Node } from '@/domain/types'
import { ValidationError } from '@/domain/types'
import { useRepo } from '@/lib/repo-context'
import { DataRoomList } from '@/components/rooms/DataRoomList'
import { RoomBrowser } from '@/components/browser/RoomBrowser'

export function AppShell({
  persistenceDegraded,
}: {
  persistenceDegraded: boolean
}) {
  const repo = useRepo()
  const [rooms, setRooms] = useState<DataRoom[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [currentRoomId, setCurrentRoomId] = useState<Id | null>(null)
  const [currentParentId, setCurrentParentId] = useState<Id | null>(null)
  const [children, setChildren] = useState<Node[]>([])
  const [crumbs, setCrumbs] = useState<Node[]>([])
  const [loadingChildren, setLoadingChildren] = useState(false)

  const currentRoom = rooms.find((r) => r.id === currentRoomId) ?? null

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
      const [kids, bread] = await Promise.all([
        repo.listChildren(roomId, parentId),
        repo.getBreadcrumbs(roomId, parentId),
      ])
      setChildren(kids)
      setCrumbs(bread)
    } finally {
      setLoadingChildren(false)
    }
  }

  useEffect(() => {
    void refreshRooms()
  }, [repo])

  useEffect(() => {
    if (currentRoomId) void refreshBrowser(currentRoomId, currentParentId)
  }, [currentRoomId, currentParentId, repo])

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
      setCurrentRoomId(room.id)
      setCurrentParentId(null)
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function handleSeed() {
    try {
      const room = await repo.seedSample()
      await refreshRooms()
      toast.success('Sample Data Room ready')
      setCurrentRoomId(room.id)
      setCurrentParentId(null)
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function handleDeleteRoom(id: Id) {
    try {
      await repo.deleteRoom(id)
      if (currentRoomId === id) {
        setCurrentRoomId(null)
        setCurrentParentId(null)
      }
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

  if (!currentRoomId || !currentRoom) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-8">
        {persistenceDegraded && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Storage unavailable — data lasts until you close the tab.
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
          onOpen={(id) => {
            setCurrentRoomId(id)
            setCurrentParentId(null)
          }}
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
      <RoomBrowser
        room={currentRoom}
        parentId={currentParentId}
        crumbs={crumbs}
        children={children}
        loading={loadingChildren}
        onBackHome={() => {
          setCurrentRoomId(null)
          setCurrentParentId(null)
        }}
        onNavigate={(folderId) => setCurrentParentId(folderId)}
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
            toast.success(`Deleted “${name}” (${n} items inside)`)
          })
        }
        onDeleteFile={(id, name) =>
          mutateAndRefresh(async () => {
            await repo.deleteFile(id)
            toast.success(`Deleted “${name}”`)
          })
        }
        onUpload={async (file) => {
          if (!currentRoomId) return
          try {
            const { node, renamedFrom } = await repo.uploadFile(
              currentRoomId,
              currentParentId,
              file,
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
        listAllFolders={async () => {
          const all: Node[] = []
          async function walk(pid: Id | null) {
            const kids = await repo.listChildren(currentRoomId!, pid)
            for (const k of kids) {
              if (k.type === 'folder') {
                all.push(k)
                await walk(k.id)
              }
            }
          }
          await walk(null)
          return all
        }}
        getFileBlob={(id) => repo.getFileBlob(id)}
        countDescendants={async (folderId) => {
          const all: Node[] = []
          async function walk(pid: Id) {
            const kids = await repo.listChildren(currentRoomId!, pid)
            for (const k of kids) {
              all.push(k)
              if (k.type === 'folder') await walk(k.id)
            }
          }
          await walk(folderId)
          return all.length
        }}
      />
    </div>
  )
}
