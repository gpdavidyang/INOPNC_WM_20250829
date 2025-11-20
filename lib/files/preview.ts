import { resolveStorageReference } from '@/lib/storage/paths'

export type FileRecordLike = {
  id?: string | number | null
  file_url?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  folder_path?: string | null
  file_name?: string | null
  title?: string | null
}

export type SignedUrlOptions = {
  downloadName?: string | null
}

export type SignedUrlRequest = {
  bucket?: string
  path?: string
  url?: string
  downloadName?: string | null
}

export function extractStorageReference(record: FileRecordLike): SignedUrlRequest {
  const bucket = record.storage_bucket || undefined
  const path = record.storage_path || record.folder_path || undefined
  const base: SignedUrlRequest = {
    bucket,
    path,
    url: record.file_url || undefined,
    downloadName: record.file_name || record.title || undefined,
  }

  if (!bucket || !path) {
    const resolved = resolveStorageReference({
      url: record.file_url || undefined,
      path: record.folder_path || undefined,
      bucket: record.storage_bucket || undefined,
    })
    if (resolved) {
      base.bucket = resolved.bucket
      base.path = resolved.objectPath
    }
  }

  return base
}

export async function fetchSignedUrlForRecord(
  record: FileRecordLike,
  options?: SignedUrlOptions
): Promise<string> {
  const reference = extractStorageReference(record)
  const params = new URLSearchParams()
  if (reference.bucket && reference.path) {
    const normalizedPath = (() => {
      const trimmed = reference.path.replace(/^\/+/, '')
      if (reference.bucket === 'documents' && !trimmed.startsWith('documents/')) {
        return `documents/${trimmed}`
      }
      return trimmed
    })()
    params.set('bucket', reference.bucket)
    params.set('path', normalizedPath)
  }
  if (reference.url) {
    params.set('url', reference.url)
  }
  const downloadName = options?.downloadName || reference.downloadName
  if (downloadName) {
    params.set('filename', downloadName)
  }

  if (params.toString().length === 0) {
    throw new Error('미리보기 가능한 파일 경로가 없습니다.')
  }

  const response = await fetch(`/api/files/signed-url?${params.toString()}`, {
    credentials: 'include',
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || !json?.url) {
    throw new Error(json?.error || '파일 링크를 불러오지 못했습니다.')
  }
  return json.url as string
}

export async function openFileRecordInNewTab(record: FileRecordLike): Promise<void> {
  const url = await fetchSignedUrlForRecord(record)
  window.open(url, '_blank', 'noopener,noreferrer')
}
