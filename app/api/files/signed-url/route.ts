import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url') || ''
    const expires = Math.max(30, Math.min(3600, Number(searchParams.get('expires') || '300')))
    if (!url) return NextResponse.json({ success: false, error: 'url required' }, { status: 400 })

    const marker = '/storage/v1/object/public/'
    const idx = url.indexOf(marker)
    if (idx === -1) return NextResponse.json({ success: true, url })
    const rest = url.slice(idx + marker.length)
    const slash = rest.indexOf('/')
    if (slash === -1) return NextResponse.json({ success: true, url })
    const bucket = rest.slice(0, slash)
    const path = rest.slice(slash + 1)

    const service = createServiceRoleClient()
    const { data, error } = await service.storage.from(bucket).createSignedUrl(path, expires)
    if (error || !data?.signedUrl) return NextResponse.json({ success: true, url })
    return NextResponse.json({ success: true, url: data.signedUrl })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
