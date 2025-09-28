import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { paySalarySnapshot } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const year = Number(body?.year)
    const month = Number(body?.month)
    const entries: Array<{ userId: string; year?: number; month?: number }> = Array.isArray(
      body?.entries
    )
      ? body.entries
      : []
    const singleUserId = String(body?.userId || '')
    if (!entries.length && singleUserId) entries.push({ userId: singleUserId, year, month })
    if (!entries.length) {
      return NextResponse.json({ success: false, error: 'no entries' }, { status: 400 })
    }

    let paid = 0
    for (const e of entries) {
      const y = Number(e.year || year)
      const m = Number(e.month || month)
      if (!e.userId || !y || !m) continue
      const res = await paySalarySnapshot(e.userId, y, m, auth.userId)
      if (res.success) paid += 1
    }
    return NextResponse.json({ success: true, paid })
  } catch (e: any) {
    console.error('POST /admin/payroll/snapshots/pay error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
