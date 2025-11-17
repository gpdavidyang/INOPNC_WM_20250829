import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'
import { getSalarySnapshot } from '@/lib/services/salary-snapshot.service'

type WorkerProfileRow = {
  id: string
  full_name?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  employment_type?: string | null
}

type SalaryLike = {
  work_days?: number
  total_labor_hours?: number
  total_work_hours?: number
  total_overtime_hours?: number
  base_pay?: number
  total_gross_pay?: number
  tax_deduction?: number
  national_pension?: number
  health_insurance?: number
  employment_insurance?: number
  total_deductions?: number
  net_pay?: number
  period_start?: string
  period_end?: string
}

function normalizeSalaryResult(
  salary: SalaryLike | null | undefined,
  periodStart: string,
  periodEnd: string
) {
  const safeBase = Number(salary?.base_pay || 0)
  const safeGross = Math.round(safeBase)
  const safeDeductions = Number(salary?.total_deductions || 0)
  const sanitized = {
    work_days: Number(salary?.work_days || 0),
    total_labor_hours: Number(salary?.total_labor_hours || 0),
    total_work_hours: Number(salary?.total_work_hours || 0),
    total_overtime_hours: Number(salary?.total_overtime_hours || 0),
    base_pay: safeBase,
    total_gross_pay: safeGross,
    tax_deduction: Number(salary?.tax_deduction || 0),
    national_pension: Number(salary?.national_pension || 0),
    health_insurance: Number(salary?.health_insurance || 0),
    employment_insurance: Number(salary?.employment_insurance || 0),
    total_deductions: safeDeductions,
    net_pay:
      typeof salary?.net_pay === 'number' ? Number(salary.net_pay) : safeGross - safeDeductions,
    period_start: salary?.period_start || periodStart,
    period_end: salary?.period_end || periodEnd,
    rate_source: (salary as any)?.rate_source,
    rates: (salary as any)?.rates,
  }
  return sanitized
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const workerIdParam = searchParams.get('workerId') || undefined
    const debug = searchParams.get('debug') === '1' || searchParams.get('debug') === 'true'
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year, month가 필요합니다.' },
        { status: 400 }
      )
    }
    const payrollPeriodStart = `${year}-${String(month).padStart(2, '0')}-01`
    const payrollPeriodEnd = new Date(year, month, 0).toISOString().split('T')[0]
    const preferSnapshotParam = searchParams.get('preferSnapshot')
    const preferSnapshot =
      preferSnapshotParam === null ||
      preferSnapshotParam === '' ||
      preferSnapshotParam.toLowerCase() === '1' ||
      preferSnapshotParam.toLowerCase() === 'true'

    // Prefer service role for stable reads across environments
    let supabase: ReturnType<typeof createServiceRoleClient | typeof createClient>
    try {
      supabase = createServiceRoleClient()
    } catch {
      supabase = createClient()
    }

    // Resolve target worker: admin/system_admin can query others, otherwise self only
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    const targetWorkerId = workerIdParam && isAdmin ? workerIdParam : auth.userId

    const { data: workerProfile } = await supabase
      .from('profiles')
      .select('id, full_name, name, email, role, employment_type')
      .eq('id', targetWorkerId)
      .maybeSingle()
    const workerProfileData = (workerProfile || null) as WorkerProfileRow | null

    const { snapshot } = await getSalarySnapshot(targetWorkerId, year, month)

    let rawSalary: SalaryLike | null = null
    let salarySource: 'snapshot' | 'calculated' = 'snapshot'
    if (preferSnapshot && snapshot?.salary) {
      rawSalary = snapshot.salary
    } else {
      salarySource = 'calculated'
      try {
        rawSalary = await salaryCalculationService.calculateMonthlySalary(
          targetWorkerId,
          year,
          month,
          undefined,
          true
        )
      } catch (calcError: any) {
        console.error(
          'Monthly salary calculation failed, using fallback:',
          calcError?.message || calcError
        )
        rawSalary = {
          work_days: 0,
          total_labor_hours: 0,
          total_work_hours: 0,
          total_overtime_hours: 0,
          base_pay: 0,
          total_gross_pay: 0,
          tax_deduction: 0,
          national_pension: 0,
          health_insurance: 0,
          employment_insurance: 0,
          total_deductions: 0,
          net_pay: 0,
          period_start: payrollPeriodStart,
          period_end: payrollPeriodEnd,
        }
      }
    }

    const normalizedMonthly = normalizeSalaryResult(rawSalary, payrollPeriodStart, payrollPeriodEnd)

    // 2) 급여 정보(일급/고용형태) 조회 (worker_salary_settings 우선, 없으면 salary_info)
    const monthStart = payrollPeriodStart
    const { data: workerSetting } = await supabase
      .from('worker_salary_settings')
      .select('employment_type, daily_rate')
      .eq('worker_id', targetWorkerId)
      .eq('is_active', true)
      .lte('effective_date', monthStart)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    let employment_type =
      workerSetting?.employment_type ||
      snapshot?.employment_type ||
      workerProfileData?.employment_type ||
      null
    let daily_rate: number | null = workerSetting?.daily_rate || (snapshot?.daily_rate ?? null)

    if (!employment_type || !daily_rate) {
      const { data: salaryInfo } = await supabase
        .from('salary_info')
        .select('*')
        .eq('user_id', targetWorkerId)
        .lte('effective_date', monthStart)
        .is('end_date', null)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      employment_type = employment_type || workerProfileData?.employment_type || 'regular_employee'
      daily_rate =
        daily_rate ||
        (salaryInfo?.hourly_rate ? Math.round((salaryInfo.hourly_rate || 0) * 8) : null)
    }

    // 3) 현장수 계산 (해당 월 내 고유 site_id 개수)
    const periodStart = payrollPeriodStart
    const periodEnd = payrollPeriodEnd
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

    // Optional debug payload: sums and sample records
    let debugInfo: any = undefined
    if (debug) {
      try {
        const { data: wr } = await supabase
          .from('work_records')
          .select('id, work_hours, labor_hours, work_date')
          .or(`user_id.eq.${targetWorkerId},profile_id.eq.${targetWorkerId}`)
          .gte('work_date', monthStart)
          .lte('work_date', periodEnd)
        const cnt = (wr || []).length
        const sumWorkHours = (wr || []).reduce(
          (s: number, r: any) => s + (Number(r.work_hours) || 0),
          0
        )
        const sumLabor = (wr || []).reduce(
          (s: number, r: any) => s + (Number(r.labor_hours) || 0),
          0
        )
        debugInfo = {
          records: cnt,
          sum_work_hours: Number(sumWorkHours.toFixed(2)),
          sum_labor_hours_field: Number(sumLabor.toFixed(2)),
          sample: (wr || []).slice(0, 3),
        }
      } catch (e) {
        void e
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        month: `${year}-${String(month).padStart(2, '0')}`,
        employment_type,
        daily_rate,
        siteCount,
        workDays: normalizedMonthly.work_days,
        totalManDays: Number(normalizedMonthly.total_labor_hours.toFixed(1)),
        salary: normalizedMonthly,
        rateSource: (normalizedMonthly as any).rate_source || null,
        rates: (normalizedMonthly as any).rates || null,
        source: salarySource,
        snapshot: snapshot
          ? {
              status: snapshot.status || 'issued',
              issued_at: snapshot.issued_at || null,
              approved_at: snapshot.approved_at || null,
              paid_at: snapshot.paid_at || null,
            }
          : null,
        worker: workerProfileData
          ? {
              id: workerProfileData.id,
              full_name: workerProfileData.full_name || workerProfileData.name || null,
              name: workerProfileData.name || workerProfileData.full_name || null,
              email: workerProfileData.email || null,
              role: workerProfileData.role || null,
              employment_type: workerProfileData.employment_type || null,
            }
          : null,
        debug: debugInfo,
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
