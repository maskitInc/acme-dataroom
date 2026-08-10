import { FolderOpen, Upload } from 'lucide-react'

/** Full-window affordance while an OS file is dragged over the browser (Drive/Dropbox pattern). */
export function FileDropOverlay({
  active,
  folderHint = 'this folder',
  variant = 'accept',
}: {
  active: boolean
  folderHint?: string
  /** accept = upload here; reject = rooms list / no room open */
  variant?: 'accept' | 'reject'
}) {
  if (!active) return null
  const reject = variant === 'reject'
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div
        className={
          reject
            ? 'flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/50 bg-background px-8 py-10 text-center shadow-lg'
            : 'flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-background px-8 py-10 text-center shadow-lg'
        }
      >
        {reject ? (
          <FolderOpen className="size-10 text-muted-foreground" aria-hidden />
        ) : (
          <Upload className="size-10 text-primary" aria-hidden />
        )}
        <p className="text-lg font-semibold text-foreground">
          {reject ? 'Open a Data Room first' : 'Drop PDF to upload'}
        </p>
        <p className="text-sm text-muted-foreground">
          {reject
            ? 'PDFs can only be uploaded inside a Data Room (or a folder within it).'
            : `Release to add the file to ${folderHint}.`}
        </p>
      </div>
    </div>
  )
}
