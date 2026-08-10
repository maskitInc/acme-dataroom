const MAX_PAGES = 40
const MAX_CHARS = 200_000

/** Extract plain text from a PDF blob for client-side search indexing. */
export async function extractPdfText(blob: Blob): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const data = new Uint8Array(await blob.arrayBuffer())
  const pdf = await getDocument({ data }).promise
  const parts: string[] = []
  const pages = Math.min(pdf.numPages, MAX_PAGES)
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    parts.push(line)
    if (parts.join('\n').length >= MAX_CHARS) break
  }
  return parts.join('\n').slice(0, MAX_CHARS)
}

export function makeSnippet(text: string, query: string, radius = 60): string {
  const lower = text.toLowerCase()
  const q = query.trim().toLowerCase()
  if (!q) return text.slice(0, radius * 2)
  const idx = lower.indexOf(q)
  if (idx < 0) return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '')
  const start = Math.max(0, idx - radius)
  const end = Math.min(text.length, idx + q.length + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}
