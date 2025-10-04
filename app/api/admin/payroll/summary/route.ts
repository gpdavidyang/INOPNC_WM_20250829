import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSalarySnapshots } from '@/lib/services/salary-snapshot.service'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const year = parseInt(sp.get('year') || '0') || undefined
  const month = parseInt(sp.get('month') || '0') || undefined
  const status = (sp.get('status') || '').trim() as any

  let { snapshots } = await listSalarySnapshots({ year, month, status })
  let source: 'snapshots' | 'fallback' = 'snapshots'
  let count = snapshots.length
  let gross = snapshots.reduce((s, x) => s + (x.salary?.total_gross_pay || 0), 0)
  let deductions = snapshots.reduce((s, x) => s + (x.salary?.total_deductions || 0), 0)
  let net = snapshots.reduce((s, x) => s + (x.salary?.net_pay || 0), 0)

  // Fallback: if no snapshots for given period, estimate from work_records
  if ((!snapshots || snapshots.length === 0) && year && month) {
    try {
      const service = createServiceRoleClient()
      const ym = `${year}-${String(month).padStart(2, '0')}`
      const start = `${ym}-01`
      const end = new Date(year, month, 0).toISOString().slice(0, 10)
      const { data: recs } = await service
        .from('work_records')
        .select('user_id, profile_id')
        .gte('work_date', start)
        .lte('work_date', end)
        .limit(5000)
      const ids = new Set<string>()
      for (const r of recs || []) {
        const id = (r as any).user_id || (r as any).profile_id
        if (id) ids.add(id)
      }
      let g = 0,
        d = 0,
        n = 0,
        c = 0
      for (const id of Array.from(ids)) {
        try {
          const res = await salaryCalculationService.calculateMonthlySalary(
            id,
            year,
            month,
            undefined,
            true
          )
          g += res.total_gross_pay || 0
          d += res.total_deductions || 0
          n += res.net_pay || 0
          c += 1
        } catch {
          // skip individual failures
        }
      }
      if (c > 0) {
        count = c
        gross = g
        deductions = d
        net = n
        source = 'fallback'
      }
    } catch {
      // ignore fallback errors
    }
  }

  return NextResponse.json({ success: true, data: { count, gross, deductions, net }, source })
}
