/** Detect OS → browser file drags across Chrome / Firefox / Safari / Edge. */

export function dataTransferHasFiles(dt: DataTransfer | null | undefined): boolean {
  if (!dt) return false
  if (dt.types) {
    for (const t of dt.types) {
      if (t === 'Files' || t === 'application/x-moz-file') return true
    }
  }
  if (dt.items?.length) {
    for (const item of dt.items) {
      if (item.kind === 'file') return true
    }
  }
  return dt.files?.length > 0
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

/** Block browser from navigating when a file is dropped outside the dropzone. */
export function installWindowFileDropGuard(): () => void {
  const onDragOver = (e: DragEvent) => {
    if (dataTransferHasFiles(e.dataTransfer)) e.preventDefault()
  }
  const onDrop = (e: DragEvent) => {
    if (dataTransferHasFiles(e.dataTransfer)) e.preventDefault()
  }
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('drop', onDrop)
  return () => {
    window.removeEventListener('dragover', onDragOver)
    window.removeEventListener('drop', onDrop)
  }
}
