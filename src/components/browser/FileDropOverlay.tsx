import { Upload } from 'lucide-react'

/** Full-window affordance while an OS file is dragged over the browser (Drive/Dropbox pattern). */
export function FileDropOverlay({
  active,
  folderHint = 'this folder',
}: {
  active: boolean
  folderHint?: string
}) {
  if (!active) return null
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-background px-8 py-10 text-center shadow-lg">
        <Upload className="size-10 text-primary" aria-hidden />
        <p className="text-lg font-semibold text-foreground">Drop PDF to upload</p>
        <p className="text-sm text-muted-foreground">
          Release to add the file to {folderHint}.
        </p>
      </div>
    </div>
  )
}
