import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Download,
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
  Hand,
  XIcon,
} from 'lucide-react'
import type { Node } from '@/domain/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const MAX_PAGES = 40
const PAN_HINT_MS = 2200

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
  const [showPanHint, setShowPanHint] = useState(false)
  const [panning, setPanning] = useState(false)
  const panRef = useRef<{
    active: boolean
    x: number
    y: number
    left: number
    top: number
  } | null>(null)
  const hintTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!preview) {
      setZoom(1)
      setRenderError(null)
      setShowPanHint(false)
      if (hintTimer.current) window.clearTimeout(hintTimer.current)
    }
  }, [preview])

  useEffect(() => {
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    if (zoom === 1) {
      setShowPanHint(false)
      return
    }
    setShowPanHint(true)
    hintTimer.current = window.setTimeout(() => setShowPanHint(false), PAN_HINT_MS)
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current)
    }
  }, [zoom])

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

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
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
    setShowPanHint(false)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    const el = viewportRef.current
    if (!pan?.active || !el) return
    el.scrollLeft = pan.left - (e.clientX - pan.x)
    el.scrollTop = pan.top - (e.clientY - pan.y)
  }

  function endPan(e: ReactPointerEvent<HTMLDivElement>) {
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
  const zoomDirty = zoom !== 1

  return (
    <Sheet
      open={!!preview}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          'flex flex-col gap-0 overflow-hidden border-0 bg-neutral-900 p-0 text-white shadow-2xl',
          // Flush to top (100dvh); desktop ~90% width centered
          'w-full max-w-none rounded-none',
          'data-[side=bottom]:inset-x-0 data-[side=bottom]:top-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-[100dvh]',
          'sm:data-[side=bottom]:inset-x-[5%] sm:data-[side=bottom]:rounded-t-2xl',
          // Full slide up / down
          'duration-300 ease-out',
          'data-starting-style:opacity-100 data-ending-style:opacity-100',
          'data-[side=bottom]:data-starting-style:translate-y-full',
          'data-[side=bottom]:data-ending-style:translate-y-full',
          'data-[side=bottom]:border-t-0',
        )}
      >
        <SheetTitle className="sr-only">{preview?.name ?? 'PDF preview'}</SheetTitle>

        <div className="relative min-h-0 flex-1">
          {/* Scroll + pan viewport */}
          <div
            ref={viewportRef}
            className={cn(
              'absolute inset-0 touch-none overflow-auto bg-neutral-800 select-none',
              panning ? 'cursor-grabbing' : 'cursor-grab',
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            {error && (
              <p className="p-6 text-sm text-red-300">{error}</p>
            )}
            {!error && !previewUrl && (
              <p className="p-6 text-white/60">Loading…</p>
            )}
            {previewUrl && !error && (
              <div
                data-pdf-pages
                className="flex min-h-full min-w-full flex-col items-center justify-center px-4 py-8"
              />
            )}
          </div>

          {/* Overlay HUD — classic PDF chrome */}
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
            <div className="relative flex items-start justify-between gap-2 p-3">
              <p className="pointer-events-none z-10 max-w-[min(40%,12rem)] truncate rounded-md bg-black/55 px-2.5 py-1.5 text-xs text-white/90 backdrop-blur-sm">
                {preview?.name}
              </p>

              {/* True horizontal center (not justify-between middle) */}
              <div className="pointer-events-auto absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 p-1 shadow-lg backdrop-blur-md">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white hover:bg-white/15 hover:text-white"
                  aria-label="Zoom out"
                  disabled={zoom <= MIN_ZOOM}
                  onClick={() => bumpZoom(-ZOOM_STEP)}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-12 px-1 text-center text-xs font-medium tabular-nums text-white">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white hover:bg-white/15 hover:text-white"
                  aria-label="Zoom in"
                  disabled={zoom >= MAX_ZOOM}
                  onClick={() => bumpZoom(ZOOM_STEP)}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    'text-white hover:bg-white/15 hover:text-white',
                    !zoomDirty && 'opacity-35',
                  )}
                  aria-label="Reset zoom"
                  disabled={!zoomDirty}
                  onClick={() => setZoom(1)}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>

              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="pointer-events-auto z-10 bg-black/55 text-white hover:bg-white/15 hover:text-white"
                    aria-label="Close"
                  />
                }
              >
                <XIcon className="size-4" />
              </SheetClose>
            </div>

            {rendering && (
              <p className="mx-auto rounded-md bg-black/55 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
                Rendering…
              </p>
            )}

            <div className="mt-auto flex flex-col items-center gap-3 p-3 pb-4">
              {showPanHint && (
                <p className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition-opacity">
                  <Hand className="size-3.5" aria-hidden /> Drag to pan
                </p>
              )}
              <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-black/55 text-white hover:bg-black/70"
                  disabled={!previewUrl}
                  onClick={() => {
                    if (previewUrl) window.open(previewUrl, '_blank')
                  }}
                >
                  <ExternalLink /> Open in new tab
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-black/55 text-white hover:bg-black/70"
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
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
