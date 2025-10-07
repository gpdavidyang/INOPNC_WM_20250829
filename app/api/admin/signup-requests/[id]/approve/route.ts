import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { approveSignupRequest } from '@/app/auth/actions'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  const id = params.id
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = body?.organizationId as string | undefined
    const siteIds = Array.isArray(body?.siteIds) ? (body.siteIds as string[]) : undefined
    const result = await approveSignupRequest(id, auth.userId, organizationId, siteIds)
    if (!result || (result as any).error) {
      return NextResponse.json(
        { success: false, error: (result as any)?.error || '승인 처리에 실패했습니다.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    console.error('[approve signup request] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
