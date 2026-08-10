import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import type { Id, Node } from '@/domain/types'
import {
  blockedMoveFolderIds,
  flattenOutline,
} from '@/domain/tree'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateFolderDialog({
  open,
  onOpenChange,
  name,
  setName,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  name: string
  setName: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="folder-name">Name</Label>
          <Input
            id="folder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) onSubmit()
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={onSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RenameDialog({
  open,
  onOpenChange,
  value,
  setValue,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  value: string
  setValue: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSubmit()
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!value.trim()} onClick={onSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  target,
  deleteCount,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  target: Node | null
  deleteCount: number
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {target?.type === 'folder' ? 'Delete folder?' : 'Delete file?'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {target?.type === 'folder'
            ? `Delete “${target.name}” and ${deleteCount} items inside?`
            : `Delete “${target?.name}”?`}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const MOVE_INDENT = 14

export function MoveDialog({
  open,
  onOpenChange,
  target,
  folders,
  moveDest,
  setMoveDest,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  target: Node | null
  folders: Node[]
  moveDest: Id | null
  setMoveDest: (id: Id | null) => void
  onConfirm: () => void
}) {
  const [expanded, setExpanded] = useState<Set<Id>>(() => new Set())

  useEffect(() => {
    if (!open) setExpanded(new Set())
  }, [open])

  const blocked = target
    ? blockedMoveFolderIds(target, folders)
    : new Set<Id>()
  const allowed = folders.filter((f) => !blocked.has(f.id))
  const rows = flattenOutline(allowed, null, expanded, { foldersOnly: true })

  function toggle(id: Id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move “{target?.name}”</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 space-y-0.5 overflow-auto">
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
              moveDest === null ? 'bg-muted' : 'hover:bg-muted/50',
            )}
            onClick={() => setMoveDest(null)}
          >
            <span className="inline-flex size-6 shrink-0" aria-hidden />
            <Folder className="size-4 shrink-0 text-muted-foreground" />
            Room root
          </button>
          {rows.map(({ node, depth, hasChildren }) => {
            const isOpen = expanded.has(node.id)
            return (
              <div
                key={node.id}
                className={cn(
                  'flex w-full items-center gap-0.5 rounded-md text-sm',
                  moveDest === node.id ? 'bg-muted' : 'hover:bg-muted/50',
                )}
              >
                <span
                  className="shrink-0"
                  style={{ width: depth * MOVE_INDENT }}
                  aria-hidden
                />
                <button
                  type="button"
                  className={cn(
                    'inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground',
                    hasChildren ? 'hover:bg-muted' : 'opacity-30',
                  )}
                  aria-label={
                    isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`
                  }
                  aria-expanded={hasChildren ? isOpen : undefined}
                  disabled={!hasChildren}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(node.id)
                  }}
                >
                  {isOpen ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
                  onClick={() => setMoveDest(node.id)}
                >
                  <Folder className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{node.name}</span>
                </button>
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
