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
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
    const status =
      (searchParams.get('status') as 'issued' | 'approved' | 'paid' | null) || undefined

    const service = createServiceRoleClient()
    let query = service
      .from('salary_snapshots')
      .select('worker_id, year, month, status, data_json')
      .order('issued_at', { ascending: false })
      .limit(500)
    if (year) query = query.eq('year', year)
    if (month) query = query.eq('month', month)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) {
      return NextResponse.json({ success: true, data: [] })
    }
    const rows = (data || []).map((r: any) => ({
      worker_id: r.worker_id,
      year: r.year,
      month: r.month,
      status: r.status,
      salary: r.data_json?.salary,
      month_label: r.data_json?.month_label || `${r.year}-${String(r.month).padStart(2, '0')}`,
    }))
    return NextResponse.json({ success: true, data: rows })
  } catch (e: any) {
    console.error('GET /admin/payroll/snapshots/list error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
