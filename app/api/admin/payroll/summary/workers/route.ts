import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSalarySnapshots } from '@/lib/services/salary-snapshot.service'

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

  const data = snapshots.map(s => ({
    worker_id: s.worker_id,
    name: (s as any).worker_name || '',
    employment_type: s.employment_type,
    daily_rate: s.daily_rate,
    total_labor_hours: s.salary?.total_labor_hours || 0,
    total_gross_pay: s.salary?.total_gross_pay || 0,
    net_pay: s.salary?.net_pay || 0,
  }))

  return NextResponse.json({ success: true, data })
}
