import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { paySalarySnapshot } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const workerId = body?.workerId as string
    const year = Number(body?.year)
    const month = Number(body?.month)
    if (!workerId || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'workerId, year, month가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await paySalarySnapshot(workerId, year, month, auth.userId)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '지급 처리 실패' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('POST /api/salary/snapshot/pay error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
