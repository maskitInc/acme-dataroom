import type { SearchHit } from '@/domain/types'
import { SearchHitRow } from '@/components/browser/SearchHitRow'
import { Button } from '@/components/ui/button'

export function SearchHits({
  hits,
  query,
  searching,
  onOpen,
  onClear,
}: {
  hits: SearchHit[]
  query: string
  searching: boolean
  onOpen: (hit: SearchHit) => void
  onClear: () => void
}) {
  if (searching) {
    return <p className="p-4 text-muted-foreground">Searching…</p>
  }

  if (hits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8">
        <p className="font-medium text-foreground">No matches in this room</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing matches “{query.trim()}” in names or PDF text.
        </p>
        <Button variant="outline" className="mt-4" onClick={onClear}>
          Clear search
        </Button>
      </div>
    )
  }

  return (
    <ul className="divide-y rounded-xl border">
      {hits.map((hit) => (
        <SearchHitRow key={hit.node.id} hit={hit} onOpen={() => onOpen(hit)} />
      ))}
    </ul>
  )
}
