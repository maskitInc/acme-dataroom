const MAX_BYTES = 20 * 1024 * 1024

export type PdfValidation =
  | { ok: true }
  | { ok: false; reason: string }

export function validatePdf(file: File): PdfValidation {
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: 'File too large (max 20 MB)' }
  }
  const nameOk = /\.pdf$/i.test(file.name)
  if (!nameOk) {
    return { ok: false, reason: 'Only PDF files are allowed' }
  }
  if (file.type && file.type !== 'application/pdf') {
    return { ok: false, reason: 'Only PDF files are allowed' }
  }
  return { ok: true }
}

export { MAX_BYTES }
