/**
 * Upload a private Storage object with byte-level progress (fetch cannot).
 * POST /storage/v1/object/{bucket}/{path}
 */
export function uploadStorageObjectWithProgress(opts: {
  supabaseUrl: string
  apikey: string
  accessToken: string
  bucket: string
  path: string
  file: Blob
  contentType?: string
  onProgress?: (loaded: number, total: number) => void
}): Promise<void> {
  const { supabaseUrl, apikey, accessToken, bucket, path, file, contentType, onProgress } =
    opts
  const encoded = path
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/')
  const url = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${encoded}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('apikey', apikey)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('Content-Type', contentType ?? 'application/pdf')

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable || !onProgress) return
      onProgress(ev.loaded, ev.total)
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      let message = `Upload failed (${xhr.status})`
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string }
        message = body.message || body.error || message
      } catch {
        // keep default
      }
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.send(file)
  })
}
