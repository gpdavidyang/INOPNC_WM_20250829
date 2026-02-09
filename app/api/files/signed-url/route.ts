import { resolveStorageReference } from '@/lib/storage/paths'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Simple passthrough for now; can be extended to generate signed URLs for private buckets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUrl = (searchParams.get('url') || '').trim()
  const pathParam = (
    searchParams.get('path') ||
    searchParams.get('storage_path') ||
    searchParams.get('object') ||
    ''
  ).trim()
  const bucketParam = (
    searchParams.get('bucket') ||
    searchParams.get('storage_bucket') ||
    ''
  ).trim()
  // support alias `filename`
  const downloadName = (searchParams.get('download') || searchParams.get('filename') || '').trim()
  if (!rawUrl && !pathParam) {
    return NextResponse.json({ success: false, error: 'Missing file reference' }, { status: 400 })
  }

  const resolved = resolveStorageReference({
    url: rawUrl || undefined,
    path: pathParam || undefined,
    bucket: bucketParam || undefined,
  })

  // Try to generate a fresh short-lived signed URL using service role
  if (resolved) {
    try {
      const svc = createServiceRoleClient()
      const options = downloadName ? { download: downloadName } : undefined
      const { data } = await svc.storage
        .from(resolved.bucket)
        .createSignedUrl(resolved.objectPath, 3600, options)
      if (data?.signedUrl) {
        return NextResponse.json({ success: true, url: data.signedUrl })
      }
    } catch (error) {
      console.warn('Signed URL generation failed, falling back to public URL', error)
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''

  // Fallback: return original URL unchanged
  if (rawUrl) {
    let finalUrl = rawUrl
    try {
      const urlObj = new URL(rawUrl)
      if (downloadName) {
        urlObj.searchParams.set('download', downloadName)
      }
      finalUrl = urlObj.toString()
    } catch {
      const fallbackBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const urlObj = new URL(rawUrl, fallbackBase)
      if (downloadName) {
        urlObj.searchParams.set('download', downloadName)
      }
      finalUrl = urlObj.toString()
    }
    return NextResponse.json({ success: true, url: finalUrl })
  }
  if (resolved && supabaseUrl) {
    const encodedPath = encodeURIComponent(resolved.objectPath).replace(/%2F/g, '/')
    const baseUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${resolved.bucket}/${encodedPath}`
    const finalUrl =
      downloadName && downloadName.length
        ? `${baseUrl}?download=${encodeURIComponent(downloadName)}`
        : baseUrl
    return NextResponse.json({ success: true, url: finalUrl })
  }

  return NextResponse.json(
    { success: false, error: 'Unable to resolve storage path' },
    { status: 422 }
  )
}
