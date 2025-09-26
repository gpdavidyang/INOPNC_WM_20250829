import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'
import { getSalarySnapshot } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const workerIdParam = searchParams.get('workerId') || undefined
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year, month가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Resolve target worker: admin/system_admin can query others, otherwise self only
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    const targetWorkerId = workerIdParam && isAdmin ? workerIdParam : auth.userId

    // 0) 스냅샷 우선 조회
    const { snapshot } = await getSalarySnapshot(targetWorkerId, year, month)

    // 1) 월간 급여 계산 (스냅샷 없으면 서버 계산). 실패 시 안전한 기본값 반환
    let monthly = snapshot?.salary as any
    if (!monthly) {
      try {
        monthly = await salaryCalculationService.calculateMonthlySalary(targetWorkerId, year, month)
      } catch (calcError: any) {
        console.error(
          'Monthly salary calculation failed, using fallback:',
          calcError?.message || calcError
        )
        const period_start = `${year}-${String(month).padStart(2, '0')}-01`
        const period_end = new Date(year, month, 0).toISOString().split('T')[0]
        monthly = {
          work_days: 0,
          total_labor_hours: 0,
          total_work_hours: 0,
          total_overtime_hours: 0,
          base_pay: 0,
          overtime_pay: 0,
          bonus_pay: 0,
          total_gross_pay: 0,
          tax_deduction: 0,
          national_pension: 0,
          health_insurance: 0,
          employment_insurance: 0,
          total_deductions: 0,
          net_pay: 0,
          period_start,
          period_end,
        }
      }
    }

    // 2) 급여 정보(일급/고용형태) 조회
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const { data: salaryInfo } = await supabase
      .from('salary_info')
      .select('*')
      .eq('user_id', targetWorkerId)
      .lte('effective_date', monthStart)
      .is('end_date', null)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: profile } = await supabase
      .from('profiles')
      .select('employment_type, full_name')
      .eq('id', targetWorkerId)
      .single()

    const daily_rate =
      snapshot?.daily_rate ??
      (salaryInfo?.hourly_rate ? Math.round((salaryInfo.hourly_rate || 0) * 8) : null)
    const employment_type = snapshot?.employment_type ?? (profile?.employment_type || 'regular')

    // 3) 현장수 계산 (해당 월 내 고유 site_id 개수)
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
    const periodEnd = new Date(year, month, 0).toISOString().split('T')[0]
    let siteCount = snapshot?.siteCount
    if (typeof siteCount !== 'number') {
      try {
        const { data: workInMonth } = await supabase
          .from('work_records')
          .select('site_id')
          .or(`user_id.eq.${targetWorkerId},profile_id.eq.${targetWorkerId}`)
          .gte('work_date', periodStart)
          .lte('work_date', periodEnd)

        siteCount = Array.from(
          new Set((workInMonth || []).map(r => r.site_id).filter(Boolean))
        ).length
      } catch (workErr) {
        console.error('work_records fetch failed, siteCount=0 fallback:', workErr)
        siteCount = 0
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        month: `${year}-${String(month).padStart(2, '0')}`,
        employment_type,
        daily_rate,
        siteCount,
        workDays: monthly.work_days,
        totalManDays: Number(monthly.total_labor_hours.toFixed(1)),
        salary: monthly,
        source: snapshot ? 'snapshot' : 'calculated',
      },
    })
  } catch (error: any) {
    console.error('API /salary/monthly error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
