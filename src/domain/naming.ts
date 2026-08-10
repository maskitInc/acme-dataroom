import { ValidationError } from './types'

/** Split "a.b.pdf" → { base: "a.b", ext: ".pdf" }; folders → ext "" */
export function splitName(name: string): { base: string; ext: string } {
  const trimmed = name.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot <= 0) return { base: trimmed, ext: '' }
  return {
    base: trimmed.slice(0, lastDot),
    ext: trimmed.slice(lastDot),
  }
}

export function uniqueName(
  desired: string,
  existingNames: Iterable<string>,
): string {
  const name = desired.trim()
  if (!name) throw new ValidationError('Name cannot be empty')
  const existing = new Set(
    [...existingNames].map((n) => n.trim()).filter(Boolean),
  )
  if (!existing.has(name)) return name
  const { base, ext } = splitName(name)
  let n = 1
  for (;;) {
    const candidate = ext ? `${base} (${n})${ext}` : `${base} (${n})`
    if (!existing.has(candidate)) return candidate
    n += 1
  }
}
