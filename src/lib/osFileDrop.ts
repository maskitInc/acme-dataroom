/** Detect OS → browser file drags across Chrome / Firefox / Safari / Edge. */

function typesList(dt: DataTransfer): string[] {
  const types = dt.types
  if (!types) return []
  const out: string[] = []
  for (let i = 0; i < types.length; i++) out.push(types[i]!)
  // Safari legacy DOMStringList
  const list = types as unknown as { contains?: (v: string) => boolean }
  if (typeof list.contains === 'function' && list.contains('Files') && !out.includes('Files')) {
    out.push('Files')
  }
  return out
}

export function dataTransferHasFiles(dt: DataTransfer | null | undefined): boolean {
  if (!dt) return false
  for (const t of typesList(dt)) {
    if (
      t === 'Files' ||
      t === 'application/x-moz-file' ||
      t === 'public.file-url' ||
      t.startsWith('application/')
    ) {
      // application/* alone is weak; only trust known file markers + items below
      if (t === 'Files' || t === 'application/x-moz-file' || t === 'public.file-url') {
        return true
      }
    }
  }
  if (dt.items?.length) {
    for (const item of dt.items) {
      if (item.kind === 'file') return true
    }
  }
  return (dt.files?.length ?? 0) > 0
}

export function filesFromDataTransfer(dt: DataTransfer): File[] {
  if (dt.files?.length) return Array.from(dt.files)
  const out: File[] = []
  if (dt.items) {
    for (const item of dt.items) {
      if (item.kind === 'file') {
        const f = item.getAsFile()
        if (f) out.push(f)
      }
    }
  }
  return out
}

export type OsFileDropHandlers = {
  onActiveChange: (active: boolean) => void
  onDrop: (files: File[]) => void
}

/**
 * Window-level OS file drop (Drive/Dropbox pattern).
 * Uses capture phase so in-app DnD libs (@dnd-kit) cannot swallow the drop.
 */
export function subscribeWindowOsFileDrop(handlers: OsFileDropHandlers): () => void {
  let depth = 0

  const reset = () => {
    depth = 0
    handlers.onActiveChange(false)
  }

  const onEnter = (e: DragEvent) => {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    e.preventDefault()
    depth += 1
    if (depth === 1) handlers.onActiveChange(true)
  }

  const onOver = (e: DragEvent) => {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }

  const onLeave = (e: DragEvent) => {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    // When leaving the document, relatedTarget is often null
    depth = Math.max(0, depth - 1)
    if (depth === 0) handlers.onActiveChange(false)
    // Ignore unused e — kept for signature parity / future relatedTarget checks
    void e
  }

  const onDrop = (e: DragEvent) => {
    if (!dataTransferHasFiles(e.dataTransfer)) return
    e.preventDefault()
    e.stopPropagation()
    const dt = e.dataTransfer
    if (!dt) {
      reset()
      return
    }
    const files = filesFromDataTransfer(dt)
    reset()
    if (files.length) handlers.onDrop(files)
  }

  // Capture = before React / @dnd-kit bubble handlers
  window.addEventListener('dragenter', onEnter, true)
  window.addEventListener('dragover', onOver, true)
  window.addEventListener('dragleave', onLeave, true)
  window.addEventListener('drop', onDrop, true)

  return () => {
    window.removeEventListener('dragenter', onEnter, true)
    window.removeEventListener('dragover', onOver, true)
    window.removeEventListener('dragleave', onLeave, true)
    window.removeEventListener('drop', onDrop, true)
    reset()
  }
}
