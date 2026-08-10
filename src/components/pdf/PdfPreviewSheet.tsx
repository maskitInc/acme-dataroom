import { Download, ExternalLink } from 'lucide-react'
import type { Node } from '@/domain/types'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export function PdfPreviewSheet({
  preview,
  previewUrl,
  previewError,
  onClose,
}: {
  preview: Node | null
  previewUrl: string | null
  previewError: string | null
  onClose: () => void
}) {
  return (
    <Sheet
      open={!!preview}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
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
  )
}
