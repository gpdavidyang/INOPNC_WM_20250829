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
    if (!year || !month)
      return NextResponse.json({ success: false, error: 'year, month required' }, { status: 400 })

    const service = createServiceRoleClient()
    const ymLabel = `${year}-${String(month).padStart(2, '0')}`
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
        .select('id, full_name, employment_type')
        .in('id', Array.from(workerIds))
      profiles = data || []
    }
    const nameMap = new Map<string, any>(profiles.map(p => [p.id, p]))

    // If no snapshots, compute on the fly for active workers (limited)
    if (workerIds.size === 0) {
      const { salaryCalculationService } = await import('@/lib/services/salary-calculation.service')
      const { data: active } = await service
        .from('profiles')
        .select('id, full_name, employment_type, role, status')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .limit(200)
      for (const p of active || []) {
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
