import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/photosheet/preview-session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id
    const data = getSession(id)
    if (!data) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg || 'Internal error' }, { status: 500 })
  }
}
