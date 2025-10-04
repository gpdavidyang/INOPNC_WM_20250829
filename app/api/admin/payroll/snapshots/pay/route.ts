import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { paySalarySnapshot } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const { workerId, year, month } = body || {}
  if (!workerId || !year || !month) {
    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
  }
  const result = await paySalarySnapshot(workerId, Number(year), Number(month), auth.userId)
  return NextResponse.json({ success: result.success, error: result.error })
}
