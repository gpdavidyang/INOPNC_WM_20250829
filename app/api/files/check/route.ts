import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url') || ''
    if (!url) return NextResponse.json({ success: false, error: 'url required' }, { status: 400 })

    // Only check http/https
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ success: true, exists: false })
    }

    // Try a HEAD request to verify existence
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    const exists = res.ok
    return NextResponse.json({ success: true, exists, status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: true, exists: false, error: e?.message }, { status: 200 })
  }
}
