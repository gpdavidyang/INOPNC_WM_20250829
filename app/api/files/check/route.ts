import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = (searchParams.get('url') || '').trim()
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing url', exists: false },
        { status: 400 }
      )
    }
    const res = await fetch(url, { method: 'HEAD' }).catch(() => null)
    if (!res) return NextResponse.json({ success: true, exists: false, status: 0 })
    return NextResponse.json({ success: true, exists: res.ok, status: res.status })
  } catch (e) {
    return NextResponse.json({ success: true, exists: false, status: 0 })
  }
}
