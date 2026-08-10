import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  ArrowLeft,
  FolderPlus,
  Search,
  Upload,
} from 'lucide-react'
import type { DataRoom, Id, Node } from '@/domain/types'
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
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { NodeRow } from '@/components/browser/NodeRow'
import { PdfPreviewSheet } from '@/components/pdf/PdfPreviewSheet'
import {
  CreateFolderDialog,
  DeleteConfirmDialog,
  MoveDialog,
  RenameDialog,
} from '@/components/dialogs/BrowserDialogs'

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

      <CreateFolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        name={folderName}
        setName={setFolderName}
        onSubmit={() =>
          void onCreateFolder(folderName).then(() => setCreateOpen(false))
        }
      />
      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        value={renameValue}
        setValue={setRenameValue}
        onSubmit={() => {
          if (renameTarget)
            void onRename(renameTarget.id, renameValue).then(() =>
              setRenameTarget(null),
            )
        }}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        target={deleteTarget}
        deleteCount={deleteCount}
        onConfirm={() => void confirmDelete()}
      />
      <MoveDialog
        open={!!moveTarget}
        onOpenChange={(o) => !o && setMoveTarget(null)}
        targetName={moveTarget?.name}
        folders={folders}
        moveDest={moveDest}
        setMoveDest={setMoveDest}
        onConfirm={() => {
          if (moveTarget)
            void onMove(moveTarget.id, moveDest).then(() => setMoveTarget(null))
        }}
      />
      <PdfPreviewSheet
        preview={preview}
        previewUrl={previewUrl}
        previewError={previewError}
        onClose={closePreview}
      />
    </div>
  )
}
