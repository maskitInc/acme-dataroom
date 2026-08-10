import { FileText, Folder } from 'lucide-react'
import type { SearchHit } from '@/domain/types'
import { formatBytes } from '@/lib/format'

export function SearchHitRow({
  hit,
  onOpen,
}: {
  hit: SearchHit
  onOpen: () => void
}) {
  const { node, match, snippet } = hit
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/60"
        onClick={onOpen}
      >
        <span className="mt-0.5 text-muted-foreground">
          {node.type === 'folder' ? (
            <Folder className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-foreground">{node.name}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {match === 'name' ? 'Name' : 'In PDF'}
            </span>
            {node.type === 'file' && node.size != null && (
              <span className="text-xs text-muted-foreground">
                {formatBytes(node.size)}
              </span>
            )}
          </span>
          {match === 'content' && (
            <span className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {snippet}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
