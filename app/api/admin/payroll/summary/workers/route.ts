import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const siteId = searchParams.get('siteId') || undefined
    const employmentType =
      (searchParams.get('employmentType') as
        | 'freelancer'
        | 'daily_worker'
        | 'regular_employee'
        | null) || undefined
    if (!year || !month)
      return NextResponse.json({ success: false, error: 'year, month required' }, { status: 400 })

    const service = createServiceRoleClient()
    const month_label = `${year}-${String(month).padStart(2, '0')}`
    const period_start = `${month_label}-01`
    const period_end = new Date(year, month, 0).toISOString().split('T')[0]
    const out: Array<{
      worker_id: string
      name: string
      employment_type: string | null
      daily_rate: number | null
      total_labor_hours: number
      total_gross_pay: number
      net_pay: number
    }> = []

    const { data: snaps } = await service
      .from('salary_snapshots')
      .select('worker_id, year, month, data_json')
      .eq('year', year)
      .eq('month', month)
      .limit(500)

    const workerIds = new Set<string>()
    const quickMap = new Map<string, any>()
    for (const r of snaps || []) {
      const s: any = (r as any).data_json
      if (!s) continue
      workerIds.add((r as any).worker_id)
      quickMap.set((r as any).worker_id, s)
    }

    let profiles: any[] = []
    if (workerIds.size) {
      const { data } = await service
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(workerIds))
      profiles = data || []
    }
    const nameMap = new Map<string, any>(profiles.map(p => [p.id, p]))

    // If site filter is set, find workers who worked at site within the month
    let siteFilteredIds: Set<string> | undefined = undefined
    if (siteId) {
      const { data: wr } = await service
        .from('work_records')
        .select('user_id, profile_id')
        .eq('site_id', siteId)
        .gte('work_date', period_start)
        .lte('work_date', period_end)
      const s = new Set<string>()
      for (const r of wr || []) {
        const uid = (r as any).user_id || (r as any).profile_id
        if (uid) s.add(uid)
      }
      siteFilteredIds = s
    }

    // If no snapshots, compute on the fly for active workers (limited)
    if (workerIds.size === 0) {
      const { salaryCalculationService } = await import('@/lib/services/salary-calculation.service')
      const { data: active } = await service
        .from('profiles')
        .select('id, full_name, role, status')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .limit(200)
      // Optional prefilter by site
      let list = (active || []) as any[]
      if (siteFilteredIds) list = list.filter(p => siteFilteredIds!.has(p.id as string))

      // Optional employment type prefilter using worker_salary_settings (active as of period_start)
      if (employmentType) {
        const { data: wsets } = await service
          .from('worker_salary_settings')
          .select('worker_id, employment_type, is_active, effective_date')
          .eq('is_active', true)
          .lte('effective_date', period_start)
        const allow = new Set<string>(
          (wsets || [])
            .filter((r: any) => r.employment_type === employmentType)
            .map((r: any) => r.worker_id)
        )
        list = list.filter(p => allow.has(p.id as string))
      }

      for (const p of list) {
        try {
          const monthly = await salaryCalculationService.calculateMonthlySalary(
            p.id as string,
            year,
            month,
            undefined,
            true
          )
          out.push({
            worker_id: p.id as string,
            name: p.full_name || p.id,
            employment_type: p.employment_type || null,
            daily_rate:
              monthly.total_labor_hours > 0
                ? Math.round((monthly.base_pay || 0) / monthly.total_labor_hours)
                : null,
            total_labor_hours: monthly.total_labor_hours,
            total_gross_pay: monthly.total_gross_pay,
            net_pay: monthly.net_pay,
          })
        } catch (e) {
          // ignore
        }
      }
      return NextResponse.json({ success: true, data: out })
    }

    for (const id of workerIds) {
      const snap = quickMap.get(id)
      const prof = nameMap.get(id)
      const salary = snap?.salary || {}
      // Apply filters
      if (employmentType) {
        const et = snap?.employment_type || null
        if (et !== employmentType) continue
      }
      if (siteFilteredIds && !siteFilteredIds.has(id)) continue

      out.push({
        worker_id: id,
        name: prof?.full_name || id,
        employment_type: snap?.employment_type || prof?.employment_type || null,
        daily_rate:
          snap?.daily_rate ??
          (salary?.total_labor_hours > 0
            ? Math.round((salary?.base_pay || 0) / salary?.total_labor_hours)
            : null),
        total_labor_hours: Number(salary?.total_labor_hours || 0),
        total_gross_pay: Number(salary?.total_gross_pay || 0),
        net_pay: Number(salary?.net_pay || 0),
      })
    }

    return NextResponse.json({ success: true, data: out })
  } catch (e: any) {
    console.error('GET /admin/payroll/summary/workers error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
