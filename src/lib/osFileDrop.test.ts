import { describe, expect, it } from 'vitest'
import { dataTransferHasFiles, filesFromDataTransfer } from '@/lib/osFileDrop'

function fakeDt(partial: {
  types?: string[]
  items?: Array<{ kind: string; type: string; getAsFile: () => File | null }>
  files?: File[]
}): DataTransfer {
  return {
    types: partial.types ?? [],
    items: (partial.items ?? []) as unknown as DataTransferItemList,
    files: (partial.files ?? []) as unknown as FileList,
  } as unknown as DataTransfer
}

describe('osFileDrop', () => {
  it('detects Files type', () => {
    expect(dataTransferHasFiles(fakeDt({ types: ['Files'] }))).toBe(true)
  })

  it('detects Firefox moz file type', () => {
    expect(
      dataTransferHasFiles(fakeDt({ types: ['application/x-moz-file'] })),
    ).toBe(true)
  })

  it('detects item.kind file', () => {
    expect(
      dataTransferHasFiles(
        fakeDt({
          items: [
            {
              kind: 'file',
              type: 'application/pdf',
              getAsFile: () => new File(['x'], 'a.pdf'),
            },
          ],
        }),
      ),
    ).toBe(true)
  })

  it('reads files from items when FileList empty', () => {
    const f = new File(['x'], 'a.pdf', { type: 'application/pdf' })
    const files = filesFromDataTransfer(
      fakeDt({
        items: [{ kind: 'file', type: 'application/pdf', getAsFile: () => f }],
        files: [],
      }),
    )
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('a.pdf')
  })
})
