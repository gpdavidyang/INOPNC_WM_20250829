import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type UploadClient = ReturnType<typeof createServiceRoleClient>

type UploadParams = {
  dataUrl: string
  siteId?: string | null
  prefix?: string
  serviceClient?: UploadClient
}

type BufferUploadParams = {
  buffer: Buffer
  mimeType: string
  siteId?: string | null
  prefix?: string
  serviceClient?: UploadClient
}

const extensionFromMime = (mime: string) => {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('pdf')) return 'pdf'
  if (mime.includes('svg')) return 'svg'
  return 'jpg'
}

/**
 * Uploads a data URL (base64) to the documents bucket and returns the public URL/path.
 */
export async function uploadDataUrlToDocumentsBucket(params: UploadParams) {
  const { dataUrl, siteId, prefix = 'markup-previews', serviceClient } = params
  const match = /^data:(.+);base64,(.+)$/i.exec(dataUrl || '')
  if (!match) return null
  const [, mimeType, base64] = match
  const buffer = Buffer.from(base64, 'base64')
  return uploadBufferToDocumentsBucket({ buffer, mimeType, siteId, prefix, serviceClient })
}

export async function uploadBufferToDocumentsBucket(params: BufferUploadParams) {
  const { buffer, mimeType, siteId, prefix = 'markup-previews', serviceClient } = params
  const ext = extensionFromMime(mimeType.toLowerCase())
  const unique = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const basePath = siteId ? `site-documents/${siteId}` : 'site-documents/common'
  const objectPath = `${basePath.replace(/\/$/, '')}/${prefix}/${unique}`
  const client = serviceClient ?? createServiceRoleClient()

  const { error } = await client.storage.from('documents').upload(objectPath, buffer, {
    contentType: mimeType,
    upsert: false,
  })
  if (error) {
    console.error('[preview-upload] failed to upload buffer', error)
    return null
  }
  const {
    data: { publicUrl },
  } = client.storage.from('documents').getPublicUrl(objectPath)
  return { url: publicUrl, path: objectPath }
}
