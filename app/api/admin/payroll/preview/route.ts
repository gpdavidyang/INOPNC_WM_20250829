import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'
import { getSalarySnapshot } from '@/lib/services/salary-snapshot.service'

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

    const { snapshot } = await getSalarySnapshot(userId, year, month)
    let monthly = snapshot?.salary ? { ...(snapshot.salary as any) } : null

    if (!monthly) {
      monthly = await salaryCalculationService.calculateMonthlySalary(
        userId,
        year,
        month,
        undefined,
        true
      )
    } else if (!monthly.rate_source || !monthly.rates) {
      try {
        const recalculated = await salaryCalculationService.calculateMonthlySalary(
          userId,
          year,
          month,
          undefined,
          true
        )
        if (recalculated?.rate_source && !monthly.rate_source) {
          monthly.rate_source = recalculated.rate_source
        }
        if (recalculated?.rates && !monthly.rates) {
          monthly.rates = recalculated.rates
        }
      } catch (calcErr) {
        console.warn('Failed to refresh rate info for payroll preview:', calcErr)
      }
    }

    if (!monthly) {
      return NextResponse.json(
        { success: false, error: '급여 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const payload = {
      ...monthly,
      employment_type: snapshot?.employment_type || monthly.employment_type || null,
      daily_rate: snapshot?.daily_rate ?? monthly.daily_rate ?? null,
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (e: any) {
    console.error('POST /admin/payroll/preview error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
