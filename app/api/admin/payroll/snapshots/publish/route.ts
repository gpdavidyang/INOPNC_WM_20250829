import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { saveSalarySnapshot, type SalarySnapshot } from '@/lib/services/salary-snapshot.service'

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
    let userIds: string[] = []
    if (Array.isArray(body?.userIds)) userIds = body.userIds.filter(Boolean)
    const singleId = String(body?.userId || '')
    if (!userIds.length && singleId) userIds = [singleId]
    if (!year || !month || !userIds.length) {
      return NextResponse.json(
        { success: false, error: 'year, month, userIds required' },
        { status: 400 }
      )
    }

    const service = createServiceRoleClient()
    const month_label = `${year}-${String(month).padStart(2, '0')}`
    const period_start = `${month_label}-01`
    const period_end = new Date(year, month, 0).toISOString().split('T')[0]

    let inserted = 0
    for (const userId of userIds) {
      try {
        const monthly = await salaryCalculationService.calculateMonthlySalary(
          userId,
          year,
          month,
          undefined,
          true
        )

        // employment_type / daily_rate 추출(가능한 경우)
        let employment_type: string | null = null
        let daily_rate: number | null = null
        try {
          const { data: workerSetting } = await service
            .from('worker_salary_settings')
            .select('employment_type, daily_rate')
            .eq('worker_id', userId)
            .eq('is_active', true)
            .lte('effective_date', period_start)
            .order('effective_date', { ascending: false })
            .limit(1)
            .maybeSingle()
          employment_type = workerSetting?.employment_type || null
          daily_rate = workerSetting?.daily_rate || null
        } catch (e) {
          // ignore best-effort meta fields
          void e
        }

        // siteCount 계산(가능한 경우)
        let siteCount = 0
        try {
          const { data: wr } = await service
            .from('work_records')
            .select('site_id')
            .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
            .gte('work_date', period_start)
            .lte('work_date', period_end)
          siteCount = Array.from(new Set((wr || []).map(r => r.site_id).filter(Boolean))).length
        } catch (e) {
          // ignore best-effort site count
          void e
        }

        const snapshot: SalarySnapshot = {
          worker_id: userId,
          year,
          month,
          month_label,
          snapshot_version: '1.0.0',
          html_template_version: '1.0.0',
          issued_at: new Date().toISOString(),
          issuer_id: auth.userId,
          status: 'issued',
          employment_type,
          daily_rate,
          siteCount,
          workDays: monthly.work_days,
          totalManDays: Number(monthly.total_labor_hours.toFixed(1)),
          salary: monthly,
        }
        const res = await saveSalarySnapshot(snapshot)
        if (res.success) inserted += 1
      } catch (e) {
        // continue
      }
    }

    return NextResponse.json({ success: true, inserted })
  } catch (e: any) {
    console.error('POST /admin/payroll/snapshots/publish error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
