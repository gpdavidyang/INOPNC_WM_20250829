import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// Simple passthrough for now; can be extended to generate signed URLs for private buckets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = (searchParams.get('url') || '').trim()
  if (!url) {
    return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
    if (supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/`)) {
      // Try to extract bucket and path: .../object/public/<bucket>/<path>
      const path = url.slice(`${supabaseUrl}/storage/v1/object/`.length)
      const parts = path.split('/')
      // Expecting: ['public' | 'sign' | 'auth' | <bucket>, ...]
      const idx = parts[0] === 'public' || parts[0] === 'sign' || parts[0] === 'auth' ? 1 : 0
      const bucket = parts[idx]
      const objectPath = parts.slice(idx + 1).join('/')
      if (bucket && objectPath) {
        try {
          const svc = createServiceRoleClient()
          const { data, error } = await svc.storage.from(bucket).createSignedUrl(objectPath, 600)
          if (!error && data?.signedUrl) {
            return NextResponse.json({ success: true, url: data.signedUrl })
          }
        } catch {
          // fall through
        }
      }
    }
  } catch {
    // ignore and fall back
  }

  // Fallback: return original URL
  return NextResponse.json({ success: true, url })
}
