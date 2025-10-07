import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { rejectSignupRequest } from '@/app/auth/actions'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  const id = params.id
  try {
    const body = await req.json().catch(() => ({}))
    const reason = typeof body?.reason === 'string' ? body.reason : undefined
    const result = await rejectSignupRequest(id, auth.userId, reason)
    if (!result || (result as any).error) {
      return NextResponse.json(
        { success: false, error: (result as any)?.error || '거절 처리에 실패했습니다.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[reject signup request] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
