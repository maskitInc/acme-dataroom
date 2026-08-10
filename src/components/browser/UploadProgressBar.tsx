import type { UploadProgress } from '@/domain/types'
import { cn } from '@/lib/utils'

export function UploadProgressBar({
  fileName,
  progress,
}: {
  fileName: string
  progress: UploadProgress
}) {
  const pct = Math.max(0, Math.min(100, progress.percent))
  return (
    <div
      className="rounded-xl border bg-background px-4 py-3 shadow-sm"
      role="status"
      aria-live="polite"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="min-w-0 truncate font-medium text-foreground">
          Uploading {fileName}
        </p>
        <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-[width] duration-150 ease-out',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {progress.label && (
        <p className="mt-1.5 text-xs text-muted-foreground">{progress.label}</p>
      )}
    </div>
  )
}
