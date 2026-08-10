import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderInput,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { Node } from '@/domain/types'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const INDENT_PX = 16

export function NodeRow({
  node,
  depth = 0,
  hasChildren = false,
  expanded = false,
  onToggleExpand,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: {
  node: Node
  depth?: number
  hasChildren?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
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
        'flex items-center gap-0.5 py-2.5 pr-2 hover:bg-muted/40',
        isDragging && 'opacity-40',
        isOver && node.type === 'folder' && 'bg-primary/10 ring-1 ring-primary/40',
      )}
    >
      <span
        className="shrink-0"
        style={{ width: depth * INDENT_PX }}
        aria-hidden
      />
      <button
        type="button"
        className="inline-flex size-7 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label="Drag to move"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>
      {node.type === 'folder' ? (
        <button
          type="button"
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground',
            hasChildren ? 'hover:bg-muted' : 'opacity-30',
          )}
          aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          aria-expanded={hasChildren ? expanded : undefined}
          disabled={!hasChildren}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand?.()
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      ) : (
        <span className="inline-flex size-7 shrink-0" aria-hidden />
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-3 pl-0.5 text-left active:cursor-grabbing"
        onClick={onOpen}
        {...listeners}
        {...attributes}
        aria-label={`${node.name} — click to open, drag to move`}
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
