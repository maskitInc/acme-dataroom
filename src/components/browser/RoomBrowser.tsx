import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderPlus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
  FolderInput,
} from 'lucide-react'
import type { DataRoom, Id, Node } from '@/domain/types'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

export function RoomBrowser({
  room,
  parentId: _parentId,
  crumbs,
  children,
  loading,
  onBackHome,
  onNavigate,
  onCreateFolder,
  onRename,
  onDeleteFolder,
  onDeleteFile,
  onUpload,
  onMove,
  listAllFolders,
  getFileBlob,
  countDescendants,
}: {
  room: DataRoom
  parentId: Id | null
  crumbs: Node[]
  children: Node[]
  loading: boolean
  onBackHome: () => void
  onNavigate: (folderId: Id | null) => void
  onCreateFolder: (name: string) => Promise<void>
  onRename: (id: Id, name: string) => Promise<void>
  onDeleteFolder: (id: Id, name: string, n: number) => Promise<void>
  onDeleteFile: (id: Id, name: string) => Promise<void>
  onUpload: (file: File) => Promise<void>
  onMove: (id: Id, newParentId: Id | null) => Promise<void>
  listAllFolders: () => Promise<Node[]>
  getFileBlob: (id: Id) => Promise<Blob>
  countDescendants: (folderId: Id) => Promise<number>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [fileDragOver, setFileDragOver] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [renameTarget, setRenameTarget] = useState<Node | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Node | null>(null)
  const [deleteCount, setDeleteCount] = useState(0)
  const [moveTarget, setMoveTarget] = useState<Node | null>(null)
  const [folders, setFolders] = useState<Node[]>([])
  const [moveDest, setMoveDest] = useState<Id | null>(null)
  const [preview, setPreview] = useState<Node | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<Node | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return children
    return children.filter((n) => n.name.toLowerCase().includes(q))
  }, [children, query])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function openPreview(node: Node) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreview(node)
    setPreviewError(null)
    setPreviewUrl(null)
    try {
      const blob = await getFileBlob(node.id)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      setPreviewError('Could not load PDF')
    }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreview(null)
    setPreviewUrl(null)
    setPreviewError(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'folder') {
      await onDeleteFolder(deleteTarget.id, deleteTarget.name, deleteCount)
    } else {
      await onDeleteFile(deleteTarget.id, deleteTarget.name)
      if (preview?.id === deleteTarget.id) closePreview()
    }
    setDeleteTarget(null)
  }

  async function openMove(node: Node) {
    setMoveTarget(node)
    setMoveDest(null)
    const all = await listAllFolders()
    setFolders(all.filter((f) => f.id !== node.id))
  }

  function handleOsFileDrop(e: DragEvent) {
    e.preventDefault()
    setFileDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    void onUpload(file)
  }

  function onDragStart(event: DragStartEvent) {
    const node = event.active.data.current?.node as Node | undefined
    setActiveDrag(node ?? null)
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return
    const dragged = active.data.current?.node as Node | undefined
    const folderId = over.data.current?.folderId as Id | undefined
    if (!dragged || !folderId) return
    if (dragged.id === folderId) return
    try {
      await onMove(dragged.id, folderId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Move failed')
    }
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onBackHome} aria-label="All rooms">
          <ArrowLeft />
        </Button>
        <h1 className="truncate text-xl font-semibold text-foreground">{room.name}</h1>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onNavigate(null)
              }}
            >
              Root
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c, i) => (
            <span key={c.id} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{c.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate(c.id)
                    }}
                  >
                    {c.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFolderName('')
            setCreateOpen(true)
          }}
        >
          <FolderPlus /> New folder
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload /> Upload PDF
        </Button>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter files and folders"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void onUpload(f)
          }}
        />
      </div>

      <div
        className={cn(
          'rounded-xl transition-colors',
          fileDragOver && 'ring-2 ring-primary ring-offset-2',
        )}
        onDragEnter={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setFileDragOver(true)
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setFileDragOver(true)
          }
        }}
        onDragLeave={() => setFileDragOver(false)}
        onDrop={handleOsFileDrop}
      >
        {loading ? (
          <p className="p-4 text-muted-foreground">Loading…</p>
        ) : children.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8">
            <p className="font-medium text-foreground">This folder is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a nested folder, upload a PDF, or drop a PDF here.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFolderName('')
                  setCreateOpen(true)
                }}
              >
                <FolderPlus /> New folder
              </Button>
              <Button onClick={() => fileRef.current?.click()}>
                <Upload /> Upload PDF
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8">
            <p className="font-medium text-foreground">No matches</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setQuery('')}>
              Clear filter
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={(e) => void onDragEnd(e)}
            onDragCancel={() => setActiveDrag(null)}
          >
            <ul className="divide-y rounded-xl border">
              {filtered.map((node) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  onOpen={() => {
                    if (node.type === 'folder') onNavigate(node.id)
                    else void openPreview(node)
                  }}
                  onRename={() => {
                    setRenameTarget(node)
                    setRenameValue(node.name)
                  }}
                  onMove={() => void openMove(node)}
                  onDelete={() => {
                    void (async () => {
                      setDeleteTarget(node)
                      if (node.type === 'folder') {
                        setDeleteCount(await countDescendants(node.id))
                      } else setDeleteCount(0)
                    })()
                  }}
                />
              ))}
            </ul>
            <DragOverlay>
              {activeDrag ? (
                <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                  {activeDrag.name}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {fileDragOver && (
          <p className="mt-2 text-center text-sm text-primary">Drop PDF to upload</p>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && folderName.trim()) {
                  void onCreateFolder(folderName).then(() => setCreateOpen(false))
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!folderName.trim()}
              onClick={() =>
                void onCreateFolder(folderName).then(() => setCreateOpen(false))
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renameTarget && renameValue.trim()) {
                void onRename(renameTarget.id, renameValue).then(() =>
                  setRenameTarget(null),
                )
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renameTarget)
                  void onRename(renameTarget.id, renameValue).then(() =>
                    setRenameTarget(null),
                  )
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.type === 'folder' ? 'Delete folder?' : 'Delete file?'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.type === 'folder'
              ? `Delete “${deleteTarget.name}” and ${deleteCount} items inside?`
              : `Delete “${deleteTarget?.name}”?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveTarget} onOpenChange={(o) => !o && setMoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move “{moveTarget?.name}”</DialogTitle>
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
            <Button variant="outline" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (moveTarget)
                  void onMove(moveTarget.id, moveDest).then(() =>
                    setMoveTarget(null),
                  )
              }}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) closePreview()
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="truncate pr-8">{preview?.name}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 px-4">
            {previewError && (
              <p className="text-sm text-destructive">{previewError}</p>
            )}
            {!previewError && !previewUrl && (
              <p className="text-muted-foreground">Loading…</p>
            )}
            {previewUrl && (
              <iframe
                title={preview?.name ?? 'PDF'}
                src={previewUrl}
                className="h-[70vh] w-full rounded-md border bg-white"
              />
            )}
          </div>
          <SheetFooter className="flex-row gap-2 sm:justify-start">
            <Button
              variant="outline"
              disabled={!previewUrl}
              onClick={() => {
                if (previewUrl) window.open(previewUrl, '_blank')
              }}
            >
              <ExternalLink /> Open in new tab
            </Button>
            <Button
              variant="outline"
              disabled={!previewUrl || !preview}
              onClick={() => {
                if (!previewUrl || !preview) return
                const a = document.createElement('a')
                a.href = previewUrl
                a.download = preview.name
                a.click()
              }}
            >
              <Download /> Download
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function NodeRow({
  node,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: {
  node: Node
  onOpen: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `drag-${node.id}`,
    data: { node },
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { folderId: node.id },
    disabled: node.type !== 'folder',
  })

  function setRefs(el: HTMLLIElement | null) {
    setDragRef(el)
    if (node.type === 'folder') setDropRef(el)
  }

  return (
    <li
      ref={setRefs}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        'flex items-center gap-1 px-2 py-2.5 hover:bg-muted/40',
        isDragging && 'opacity-40',
        isOver && node.type === 'folder' && 'bg-primary/10 ring-1 ring-primary/40',
      )}
    >
      <button
        type="button"
        className="inline-flex size-7 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        aria-label="Drag to move"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={onOpen}
      >
        {node.type === 'folder' ? (
          <Folder className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{node.name}</div>
          {node.type === 'file' && (
            <div className="text-xs text-muted-foreground">
              {formatBytes(node.size)} ·{' '}
              {new Date(node.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Item actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRename}>
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMove}>
            <FolderInput /> Move to…
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
