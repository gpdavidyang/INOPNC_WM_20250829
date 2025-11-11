export type StorageObjectRef = {
  bucket: string
  objectPath: string
}

const SCOPE_SEGMENTS = new Set(['public', 'sign', 'auth'])

const normalizeSegment = (value: string) => decodeURIComponent(value || '')

const normalizeObjectPath = (value: string) =>
  value.replace(/^\/+/, '').replace(/%2F/gi, '/').replace(/\/+/g, '/')

/**
 * Parses a Supabase storage URL (public/sign/auth) and returns the bucket/object path.
 */
export function parseSupabaseStorageUrl(url?: string | null): StorageObjectRef | null {
  if (!url || typeof url !== 'string') return null
  try {
    const marker = '/storage/v1/object/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    const after = normalizeObjectPath(url.slice(idx + marker.length))
    const parts = after.split('/').filter(Boolean)
    if (parts.length < 2) return null
    const first = normalizeSegment(parts[0])
    const offset = SCOPE_SEGMENTS.has(first) ? 1 : 0
    if (parts.length - offset < 2) return null
    const bucket = normalizeSegment(parts[offset])
    const objectPath = parts
      .slice(offset + 1)
      .map(normalizeSegment)
      .join('/')
    if (!bucket || !objectPath) return null
    return { bucket, objectPath }
  } catch {
    return null
  }
}

/**
 * Parses a storage path string. The string can either include the bucket as the first segment
 * or rely on an explicit bucket hint.
 */
export function parseStoragePath(
  path?: string | null,
  bucketHint?: string | null
): StorageObjectRef | null {
  if (!path || typeof path !== 'string') return null
  const normalized = normalizeObjectPath(path)
  if (!normalized) return null
  if (bucketHint) {
    const bucket = bucketHint.replace(/^\/+|\/+$/g, '')
    if (!bucket) return null
    if (normalized.startsWith(`${bucket}/`)) {
      return { bucket, objectPath: normalized.slice(bucket.length + 1) }
    }
    return { bucket, objectPath: normalized }
  }
  const parts = normalized.split('/').filter(Boolean)
  if (parts.length < 2) return null
  const bucket = parts[0]
  const objectPath = parts.slice(1).join('/')
  if (!bucket || !objectPath) return null
  return { bucket, objectPath }
}

/**
 * Attempts to resolve a storage reference from either a URL or a path value.
 */
export function resolveStorageReference(params: {
  url?: string | null
  path?: string | null
  bucket?: string | null
}): StorageObjectRef | null {
  const { url, path, bucket } = params
  return (
    parseStoragePath(path, bucket) ||
    parseSupabaseStorageUrl(url) ||
    parseStoragePath(url, bucket) ||
    null
  )
}
