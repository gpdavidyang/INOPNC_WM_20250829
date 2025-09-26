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
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year, month가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 0) 스냅샷 우선 조회
    const { snapshot } = await getSalarySnapshot(auth.userId, year, month)

    // 1) 월간 급여 계산 (스냅샷 없으면 서버 계산)
    const monthly = snapshot
      ? snapshot.salary
      : await salaryCalculationService.calculateMonthlySalary(auth.userId, year, month)

    // 2) 급여 정보(일급/고용형태) 조회
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const { data: salaryInfo } = await supabase
      .from('salary_info')
      .select('*')
      .eq('user_id', auth.userId)
      .lte('effective_date', monthStart)
      .is('end_date', null)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: profile } = await supabase
      .from('profiles')
      .select('employment_type, full_name')
      .eq('id', auth.userId)
      .single()

    const daily_rate =
      snapshot?.daily_rate ??
      (salaryInfo?.hourly_rate ? Math.round((salaryInfo.hourly_rate || 0) * 8) : null)
    const employment_type = snapshot?.employment_type ?? (profile?.employment_type || 'regular')

    // 3) 현장수 계산 (해당 월 내 고유 site_id 개수)
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
    const periodEnd = new Date(year, month, 0).toISOString().split('T')[0]
    const { data: workInMonth } = await supabase
      .from('work_records')
      .select('site_id')
      .or(`user_id.eq.${auth.userId},profile_id.eq.${auth.userId}`)
      .gte('work_date', periodStart)
      .lte('work_date', periodEnd)

    const siteCount =
      snapshot?.siteCount ??
      Array.from(new Set((workInMonth || []).map(r => r.site_id).filter(Boolean))).length

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
