import type { Id, Node } from '@/domain/types'
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

export function MoveDialog({
  open,
  onOpenChange,
  targetName,
  folders,
  moveDest,
  setMoveDest,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  targetName?: string
  folders: Node[]
  moveDest: Id | null
  setMoveDest: (id: Id | null) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move “{targetName}”</DialogTitle>
        </DialogHeader>
        <div className="max-h-64 space-y-1 overflow-auto">
          <button
            type="button"
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
              moveDest === null ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => setMoveDest(null)}
          >
            Room root
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                moveDest === f.id ? 'bg-muted' : 'hover:bg-muted/50'
              }`}
              onClick={() => setMoveDest(f.id)}
            >
              {f.name}
            </button>
          ))}
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
