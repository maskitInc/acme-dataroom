import { useState } from 'react'
import { FolderOpen, MoreHorizontal, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { DataRoom, Id } from '@/domain/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DataRoomList({
  rooms,
  loading,
  onCreate,
  onOpen,
  onDelete,
  onSeed,
}: {
  rooms: DataRoom[]
  loading: boolean
  onCreate: (name: string) => Promise<void>
  onOpen: (id: Id) => void
  onDelete: (id: Id) => Promise<void>
  onSeed: () => Promise<void>
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DataRoom | null>(null)

  async function submitCreate() {
    setBusy(true)
    try {
      await onCreate(name)
      setName('')
      setCreateOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-start justify-center gap-4 rounded-xl border border-dashed p-10 text-left">
        <h2 className="text-xl font-medium text-foreground">No Data Rooms yet</h2>
        <p className="max-w-md text-muted-foreground">
          Create a room to organize diligence folders and PDF documents.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Create Data Room
          </Button>
          <Button variant="outline" onClick={() => void onSeed()}>
            <Sparkles /> Load sample
          </Button>
        </div>
        <CreateRoomDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          name={name}
          setName={setName}
          busy={busy}
          onSubmit={() => void submitCreate()}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Create Data Room
        </Button>
        <Button variant="outline" onClick={() => void onSeed()}>
          <Sparkles /> Load sample
        </Button>
      </div>
      <ul className="divide-y rounded-xl border">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onOpen(room.id)}
            >
              <FolderOpen className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {room.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(room.createdAt).toLocaleString()}
                </div>
              </div>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Room actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen(room.id)}>
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(room)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        name={name}
        setName={setName}
        busy={busy}
        onSubmit={() => void submitCreate()}
      />
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data Room?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete “{deleteTarget?.name}” and all folders and files inside?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void onDelete(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateRoomDialog({
  open,
  onOpenChange,
  name,
  setName,
  busy,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  name: string
  setName: (v: string) => void
  busy: boolean
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Data Room</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="room-name">Name</Label>
          <Input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme diligence"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit()
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy || !name.trim()} onClick={onSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
