import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  FolderInput,
} from 'lucide-react'
import type { DataRoom, Id, Node } from '@/domain/types'
import { formatBytes } from '@/lib/format'
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
    // exclude self and descendants for folders — simplified: exclude self only in UI;
    // repo blocks cycles
    setFolders(all.filter((f) => f.id !== node.id))
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

      <div className="flex flex-wrap gap-2">
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

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : children.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8">
          <p className="font-medium text-foreground">This folder is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a nested folder or upload a PDF.
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
      ) : (
        <ul className="divide-y rounded-xl border">
          {children.map((node) => (
            <li
              key={node.id}
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => {
                  if (node.type === 'folder') onNavigate(node.id)
                  else void openPreview(node)
                }}
              >
                {node.type === 'folder' ? (
                  <Folder className="size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">
                    {node.name}
                  </div>
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
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameTarget(node)
                      setRenameValue(node.name)
                    }}
                  >
                    <Pencil /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void openMove(node)}>
                    <FolderInput /> Move to…
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      void (async () => {
                        setDeleteTarget(node)
                        if (node.type === 'folder') {
                          setDeleteCount(await countDescendants(node.id))
                        } else setDeleteCount(0)
                      })()
                    }}
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      {/* Create folder */}
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

      {/* Rename */}
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

      {/* Delete */}
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

      {/* Move */}
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

      {/* PDF preview */}
      <Sheet
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) closePreview()
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col sm:max-w-xl"
        >
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
