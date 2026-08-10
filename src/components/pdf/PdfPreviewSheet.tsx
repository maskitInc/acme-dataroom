import { useEffect, useRef, useState } from 'react'
import {
  Download,
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
  Hand,
} from 'lucide-react'
import type { Node } from '@/domain/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const MAX_PAGES = 40

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
  const viewportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [pageCount, setPageCount] = useState(0)
  const [panning, setPanning] = useState(false)
  const panRef = useRef<{
    active: boolean
    x: number
    y: number
    left: number
    top: number
  } | null>(null)

  useEffect(() => {
    if (!preview) {
      setZoom(1)
      setRenderError(null)
      setPageCount(0)
    }
  }, [preview])

  useEffect(() => {
    if (!previewUrl || !viewportRef.current) return
    let cancelled = false
    const host = viewportRef.current.querySelector('[data-pdf-pages]')
    if (!host) return
    host.innerHTML = ''

    void (async () => {
      setRendering(true)
      setRenderError(null)
      try {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
        GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const data = await fetch(previewUrl).then((r) => r.arrayBuffer())
        const pdf = await getDocument({ data: new Uint8Array(data) }).promise
        if (cancelled) return
        const pages = Math.min(pdf.numPages, MAX_PAGES)
        setPageCount(pages)

        for (let i = 1; i <= pages; i++) {
          const page = await pdf.getPage(i)
          if (cancelled) return
          const viewport = page.getViewport({ scale: zoom * devicePixelRatio })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = `${viewport.width / devicePixelRatio}px`
          canvas.style.height = `${viewport.height / devicePixelRatio}px`
          canvas.className = 'mx-auto mb-4 block bg-white shadow-md'
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          await page.render({ canvas, canvasContext: ctx, viewport }).promise
          if (cancelled) return
          host.appendChild(canvas)
        }
      } catch {
        if (!cancelled) setRenderError('Could not render PDF')
      } finally {
        if (!cancelled) setRendering(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [previewUrl, zoom])

  function bumpZoom(delta: number) {
    setZoom((z) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)),
    )
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const el = viewportRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    panRef.current = {
      active: true,
      x: e.clientX,
      y: e.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
    }
    setPanning(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    const el = viewportRef.current
    if (!pan?.active || !el) return
    el.scrollLeft = pan.left - (e.clientX - pan.x)
    el.scrollTop = pan.top - (e.clientY - pan.y)
  }

  function endPan(e: React.PointerEvent<HTMLDivElement>) {
    if (!panRef.current?.active) return
    panRef.current = null
    setPanning(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // already released
    }
  }

  const error = previewError || renderError

  return (
    <Sheet
      open={!!preview}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="inset-0 flex h-dvh w-full max-w-none flex-col gap-0 border-0 p-0 sm:max-w-none data-[side=right]:w-full"
      >
        <SheetHeader className="shrink-0 flex-row items-center gap-3 border-b pr-12">
          <SheetTitle className="min-w-0 flex-1 truncate text-left">
            {preview?.name}
          </SheetTitle>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => bumpZoom(-ZOOM_STEP)}
            >
              <Minus />
            </Button>
            <span className="w-14 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => bumpZoom(ZOOM_STEP)}
            >
              <Plus />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reset zoom"
              onClick={() => setZoom(1)}
            >
              <RotateCcw />
            </Button>
          </div>
        </SheetHeader>

        <div
          ref={viewportRef}
          className={cn(
            'relative min-h-0 flex-1 touch-none overflow-auto bg-neutral-700 select-none',
            panning ? 'cursor-grabbing' : 'cursor-grab',
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          onPointerLeave={(e) => {
            if (panRef.current?.active) endPan(e)
          }}
        >
          {error && (
            <p className="p-6 text-sm text-destructive">{error}</p>
          )}
          {!error && !previewUrl && (
            <p className="p-6 text-muted-foreground">Loading…</p>
          )}
          {previewUrl && !error && (
            <div
              data-pdf-pages
              className="flex min-h-full min-w-full flex-col items-center px-4 py-6"
            />
          )}
          {rendering && (
            <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
              Rendering…
            </p>
          )}
          {pageCount > 0 && zoom > 1 && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
              <Hand className="size-3.5" aria-hidden /> Drag to pan
            </p>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row gap-2 border-t sm:justify-start">
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
