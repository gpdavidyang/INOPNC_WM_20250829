import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSalarySnapshots } from '@/lib/services/salary-snapshot.service'
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
  const { snapshots } = await listSalarySnapshots({ year, month })
  const workerIds = Array.from(new Set(snapshots.map(s => s.worker_id).filter(Boolean)))

  let nameMap: Record<string, string> = {}
  if (workerIds.length > 0) {
    try {
      const supabase = createServiceRoleClient()
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', workerIds)
      nameMap = Object.fromEntries(
        (data || []).map(row => [String(row.id), String(row.full_name || '')])
      )
    } catch (e) {
      console.warn('Failed to load worker names for payroll summary:', e)
    }
  }

  const employmentLabel = {
    freelancer: '프리랜서',
    daily_worker: '일용직',
    regular_employee: '상용직',
  } as Record<string, string>

  const data = snapshots.map(s => ({
    worker_id: s.worker_id,
    name: nameMap[s.worker_id] || (s as any).worker_name || '-',
    employment_type: employmentLabel[String(s.employment_type || '').toLowerCase()] || '-',
    daily_rate: s.daily_rate,
    total_labor_hours: s.salary?.total_labor_hours || 0,
    total_gross_pay: s.salary?.total_gross_pay || 0,
    net_pay: s.salary?.net_pay || 0,
    status: s.status || null,
    issued_at: s.issued_at || null,
  }))

  return NextResponse.json({ success: true, data })
}
