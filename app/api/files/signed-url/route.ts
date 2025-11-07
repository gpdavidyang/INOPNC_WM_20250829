import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// Simple passthrough for now; can be extended to generate signed URLs for private buckets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUrl = (searchParams.get('url') || '').trim()
  // support alias `filename`
  const downloadName = (searchParams.get('download') || searchParams.get('filename') || '').trim()
  if (!rawUrl) {
    return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })
  }

  // Helper to extract bucket/objectPath from any Supabase storage object URL
  const extractBucketPath = (input: string): { bucket: string; objectPath: string } | null => {
    try {
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
      // Normalize into a pathname starting from '/storage/v1/object/...'
      let pathname = ''
      if (input.startsWith('http')) {
        // absolute URL
        const u = new URL(input)
        pathname = u.pathname
      } else {
        // relative path
        pathname = input
      }
      const marker = '/storage/v1/object/'
      const idx = pathname.indexOf(marker)
      if (idx === -1) return null
      const after = pathname.slice(idx + marker.length)
      const parts = after.split('/').filter(Boolean)
      if (parts.length < 2) return null
      // Skip leading segment if it's one of public/sign/auth
      const first = parts[0]
      const offset = first === 'public' || first === 'sign' || first === 'auth' ? 1 : 0
      const bucket = parts[offset]
      const objectPath = parts.slice(offset + 1).join('/')
      if (!bucket || !objectPath) return null
      return { bucket, objectPath }
    } catch {
      return null
    }
  }

  // Try to generate a fresh short-lived signed URL using service role
  try {
    const parsed = extractBucketPath(rawUrl)
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
  return NextResponse.json({ success: true, url: rawUrl })
}
