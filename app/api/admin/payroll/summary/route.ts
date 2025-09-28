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
    const status = searchParams.get('status') as 'issued' | 'approved' | 'paid' | null
    if (!year || !month) {
      return NextResponse.json({ success: false, error: 'year, month required' }, { status: 400 })
    }

    const service = createServiceRoleClient()
    let count = 0
    let gross = 0
    let deductions = 0
    let net = 0

    try {
      let query = service
        .from('salary_snapshots')
        .select('data_json, status')
        .eq('year', year)
        .eq('month', month)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        for (const row of data as any[]) {
          const s = row?.data_json?.salary
          if (s) {
            count += 1
            gross += Number(s.total_gross_pay || 0)
            deductions += Number(s.total_deductions || 0)
            net += Number(s.net_pay || 0)
          }
        }
      }
    } catch (e) {
      // ignore when table not present
      void e
    }

    return NextResponse.json({ success: true, data: { count, gross, deductions, net } })
  } catch (e: any) {
    console.error('GET /admin/payroll/summary error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
