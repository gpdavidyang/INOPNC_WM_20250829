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
    const siteId = searchParams.get('siteId') || undefined
    const employmentType =
      (searchParams.get('employmentType') as
        | 'freelancer'
        | 'daily_worker'
        | 'regular_employee'
        | null) || undefined

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
    let rows = (data || []).map((r: any) => ({
      worker_id: r.worker_id,
      year: r.year,
      month: r.month,
      status: r.status,
      salary: r.data_json?.salary,
      employment_type: r.data_json?.employment_type || null,
      month_label: r.data_json?.month_label || `${r.year}-${String(r.month).padStart(2, '0')}`,
    }))

    // Filter by employment type
    if (employmentType) {
      // If snapshot lacks employment_type, we could join profiles, but keep it simple here
      rows = rows.filter(r => (r as any).employment_type === employmentType)
    }

    // Filter by siteId using work_records for given month range
    if (siteId && year && month) {
      const month_label = `${year}-${String(month).padStart(2, '0')}`
      const period_start = `${month_label}-01`
      const period_end = new Date(year, month, 0).toISOString().split('T')[0]
      const { data: wr } = await service
        .from('work_records')
        .select('user_id, profile_id')
        .eq('site_id', siteId)
        .gte('work_date', period_start)
        .lte('work_date', period_end)
      const allowed = new Set<string>()
      for (const r of wr || []) {
        const uid = (r as any).user_id || (r as any).profile_id
        if (uid) allowed.add(uid)
      }
      rows = rows.filter(r => allowed.has(r.worker_id))
    }

    return NextResponse.json({ success: true, data: rows })
  } catch (e: any) {
    console.error('GET /admin/payroll/snapshots/list error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
