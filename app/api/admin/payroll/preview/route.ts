import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const userId = String(body?.userId || '')
    const year = Number(body?.year)
    const month = Number(body?.month)
    if (!userId || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'userId, year, month required' },
        { status: 400 }
      )
    }

    const monthly = await salaryCalculationService.calculateMonthlySalary(
      userId,
      year,
      month,
      undefined,
      true
    )
    return NextResponse.json({ success: true, data: monthly })
  } catch (e: any) {
    console.error('POST /admin/payroll/preview error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
