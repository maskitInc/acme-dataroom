import { useEffect, useRef, useState, type DragEvent } from 'react'
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
import type { DataRoom, Id, Node, SearchHit, UploadProgress } from '@/domain/types'
import { cn } from '@/lib/utils'
import {
  dataTransferHasFiles,
  filesFromDataTransfer,
  installWindowFileDropGuard,
} from '@/lib/osFileDrop'
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
import { SearchHits } from '@/components/browser/SearchHits'
import { UploadProgressBar } from '@/components/browser/UploadProgressBar'
import { PdfPreviewSheet } from '@/components/pdf/PdfPreviewSheet'
import {
  CreateFolderDialog,
  DeleteConfirmDialog,
  MoveDialog,
  RenameDialog,
} from '@/components/dialogs/BrowserDialogs'

const SEARCH_DEBOUNCE_MS = 250

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
  onSearch,
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
  onUpload: (
    file: File,
    onProgress?: (p: UploadProgress) => void,
  ) => Promise<void>
  onMove: (id: Id, newParentId: Id | null) => Promise<void>
  listAllFolders: () => Promise<Node[]>
  getFileBlob: (id: Id) => Promise<Blob>
  onSearch: (query: string) => Promise<SearchHit[]>
  countDescendants: (folderId: Id) => Promise<number>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const searchGen = useRef(0)
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch
  const [fileDragOver, setFileDragOver] = useState(false)
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  )
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

  const searchingRoom = query.trim().length > 0
  const uploading = uploadName != null

  useEffect(() => installWindowFileDropGuard(), [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      searchGen.current += 1
      setHits([])
      setSearching(false)
      return
    }
    const gen = ++searchGen.current
    setSearching(true)
    const t = window.setTimeout(() => {
      void onSearchRef
        .current(q)
        .then((result) => {
          if (gen !== searchGen.current) return
          setHits(result)
        })
        .catch((err) => {
          if (gen !== searchGen.current) return
          setHits([])
          toast.error(err instanceof Error ? err.message : 'Search failed')
        })
        .finally(() => {
          if (gen === searchGen.current) setSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function runUpload(file: File) {
    if (uploading) {
      toast.message('Wait for the current upload to finish')
      return
    }
    setUploadName(file.name)
    setUploadProgress({ phase: 'validate', percent: 0, label: 'Starting…' })
    try {
      await onUpload(file, (p) => setUploadProgress(p))
    } finally {
      setUploadName(null)
      setUploadProgress(null)
    }
  }
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

  function openHit(hit: SearchHit) {
    if (hit.node.type === 'folder') {
      setQuery('')
      onNavigate(hit.node.id)
      return
    }
    void openPreview(hit.node)
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

  function clearFileDrag() {
    dragDepth.current = 0
    setFileDragOver(false)
  }

  function handleOsFileDragEnter(e: DragEvent) {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current += 1
    setFileDragOver(true)
  }

  function handleOsFileDragOver(e: DragEvent) {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setFileDragOver(true)
  }

  function handleOsFileDragLeave(e: DragEvent) {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setFileDragOver(false)
  }

  function handleOsFileDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    clearFileDrag()
    const file = filesFromDataTransfer(e.dataTransfer)[0]
    if (!file) return
    void runUpload(file)
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
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload /> Upload PDF
        </Button>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search names & PDF text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search files and folders in this room"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void runUpload(f)
          }}
        />
      </div>

      {uploadName && uploadProgress && (
        <UploadProgressBar fileName={uploadName} progress={uploadProgress} />
      )}

      <div
        className={cn(
          'rounded-xl transition-colors',
          fileDragOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5',
        )}
        onDragEnter={handleOsFileDragEnter}
        onDragOver={handleOsFileDragOver}
        onDragLeave={handleOsFileDragLeave}
        onDrop={handleOsFileDrop}
      >
        {searchingRoom ? (
          <SearchHits
            hits={hits}
            query={query}
            searching={searching}
            onOpen={openHit}
            onClear={() => setQuery('')}
          />
        ) : loading ? (
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
              <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload /> Upload PDF
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={(e) => void onDragEnd(e)}
            onDragCancel={() => setActiveDrag(null)}
          >
            <ul className="divide-y rounded-xl border">
              {children.map((node) => (
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
