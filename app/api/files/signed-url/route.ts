import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { resolveStorageReference } from '@/lib/storage/paths'

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

  // Try to generate a fresh short-lived signed URL using service role
  try {
    const parsed = resolveStorageReference({
      url: rawUrl || undefined,
      path: pathParam || undefined,
      bucket: bucketParam || undefined,
    })
    if (parsed) {
      const svc = createServiceRoleClient()
      const options = downloadName ? { download: downloadName } : undefined
      const { data } = await svc.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.objectPath, 600, options)
      if (data?.signedUrl) {
        return NextResponse.json({ success: true, url: data.signedUrl })
      }
    }
  } catch {
    // best-effort; fall back below
  }

  // Fallback: return original URL unchanged
  if (rawUrl) {
    return NextResponse.json({ success: true, url: rawUrl })
  }
  return NextResponse.json(
    { success: false, error: 'Unable to resolve storage path' },
    { status: 422 }
  )
}
