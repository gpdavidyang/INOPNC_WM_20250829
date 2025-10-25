import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/photosheet/preview-session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as any
    if (!data || typeof data !== 'object')
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    // Basic shape validation
    if (!data.rows || !data.cols || !Array.isArray(data.items)) {
      return NextResponse.json({ error: 'Invalid preview data' }, { status: 400 })
    }
    const id = createSession(data, 10 * 60 * 1000)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg || 'Internal error' }, { status: 500 })
  }
}
