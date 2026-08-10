import { useEffect, useMemo, useRef, useState } from 'react'
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
import { wouldCreateCycle } from '@/domain/cascade'
import { flattenOutline } from '@/domain/tree'
import { cn } from '@/lib/utils'
import { subscribeWindowOsFileDrop } from '@/lib/osFileDrop'
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
import { FileDropOverlay } from '@/components/browser/FileDropOverlay'
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
  parentId,
  crumbs,
  roomNodes,
  loading,
  onBackHome,
  onNavigate,
  onCreateFolder,
  onRename,
  onDeleteFolder,
  onDeleteFile,
  onUpload,
  onMove,
  getFileBlob,
  onSearch,
  countDescendants,
}: {
  room: DataRoom
  parentId: Id | null
  crumbs: Node[]
  roomNodes: Node[]
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
  getFileBlob: (id: Id) => Promise<Blob>
  onSearch: (query: string) => Promise<SearchHit[]>
  countDescendants: (folderId: Id) => Promise<number>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const runUploadRef = useRef<(file: File) => Promise<void>>(async () => {})
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const searchGen = useRef(0)
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch
  const [fileDragActive, setFileDragActive] = useState(false)
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
  const [moveDest, setMoveDest] = useState<Id | null>(null)
  const [preview, setPreview] = useState<Node | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<Node | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<Id>>(() => new Set())

  const nodeIds = useMemo(
    () => new Set(roomNodes.map((n) => n.id)),
    [roomNodes],
  )
  useEffect(() => {
    setExpandedIds((prev) => {
      let changed = false
      const next = new Set<Id>()
      for (const id of prev) {
        if (nodeIds.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [nodeIds])

  const outlineRows = useMemo(
    () => flattenOutline(roomNodes, parentId, expandedIds),
    [roomNodes, parentId, expandedIds],
  )
  const nodesById = useMemo(
    () => new Map(roomNodes.map((n) => [n.id, n])),
    [roomNodes],
  )
  const moveFolders = useMemo(
    () => roomNodes.filter((n) => n.type === 'folder'),
    [roomNodes],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
  )

  const searchingRoom = query.trim().length > 0
  const uploading = uploadName != null

  async function runUpload(file: File) {
    if (uploadName != null) {
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
  runUploadRef.current = runUpload

  useEffect(() => {
    return subscribeWindowOsFileDrop({
      onActiveChange: setFileDragActive,
      onDrop: (files) => {
        const file = files[0]
        if (!file) return
        void runUploadRef.current(file)
      },
    })
  }, [])

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
  async function openPreview(node: Node) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreview(node)
    setPreviewError(null)
    setPreviewUrl(null)
    try {
      const blob = await getFileBlob(node.id)
      // Browsers only render PDF viewer for application/pdf (Storage often returns octet-stream)
      const pdf =
        blob.type === 'application/pdf'
          ? blob
          : new Blob([blob], { type: 'application/pdf' })
      setPreviewUrl(URL.createObjectURL(pdf))
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

  function openMove(node: Node) {
    setMoveTarget(node)
    setMoveDest(null)
  }

  function toggleExpand(id: Id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
    if (wouldCreateCycle(dragged.id, folderId, nodesById)) {
      toast.error('Cannot move a folder into itself or a descendant')
      return
    }
    try {
      await onMove(dragged.id, folderId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Move failed')
    }
  }

  return (
    <div className="relative flex flex-col gap-4 text-left">
      <FileDropOverlay
        active={fileDragActive && !uploading}
        folderHint={
          crumbs.length > 0
            ? `“${crumbs[crumbs.length - 1]!.name}”`
            : 'the room root'
        }
      />
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
          fileDragActive && 'ring-2 ring-primary ring-offset-2 bg-primary/5',
        )}
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
        ) : outlineRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-muted-foreground/40 p-8">
            <p className="font-medium text-foreground">This folder is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a nested folder, upload a PDF, or drag a PDF anywhere onto
              this window.
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
              {outlineRows.map(({ node, depth, hasChildren }) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  depth={depth}
                  hasChildren={hasChildren}
                  expanded={expandedIds.has(node.id)}
                  onToggleExpand={() => toggleExpand(node.id)}
                  onOpen={() => {
                    if (node.type === 'folder') onNavigate(node.id)
                    else void openPreview(node)
                  }}
                  onRename={() => {
                    setRenameTarget(node)
                    setRenameValue(node.name)
                  }}
                  onMove={() => openMove(node)}
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
        target={moveTarget}
        folders={moveFolders}
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
