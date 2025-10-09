import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import type { SalarySnapshot } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    if (!['admin', 'system_admin'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || undefined) as
      | 'issued'
      | 'approved'
      | 'paid'
      | undefined
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
    const employmentType = searchParams.get('employmentType') || undefined
    // siteId is handled on client (derived from work_records by month)
    const limitRaw = searchParams.get('limit')
    const limit = Math.min(200, Math.max(10, limitRaw ? Number(limitRaw) || 100 : 100))

    const supabase = createClient()

    // Base query from snapshots table
    let query = supabase
      .from('salary_snapshots')
      .select(
        'worker_id, year, month, data_json, issued_at, issuer_id, status, approved_at, approver_id, paid_at, payer_id'
      )
      .order('issued_at', { ascending: false })
      .limit(limit)

    if (year) query = query.eq('year', year)
    if (month) query = query.eq('month', month)
    if (status) query = query.eq('status', status)
    if (employmentType) query = query.contains('data_json', { employment_type: employmentType })

    const { data, error } = await query
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch snapshots' },
        { status: 500 }
      )
    }

    const snapshots: SalarySnapshot[] = (data || [])
      .map((row: any) => {
        const snap = (row?.data_json || null) as SalarySnapshot | null
        if (!snap) return null
        // Normalize status/meta from columns
        snap.status = (row.status as any) || snap.status || 'issued'
        snap.approved_at = row.approved_at || snap.approved_at || null
        snap.approver_id = row.approver_id || snap.approver_id || null
        snap.paid_at = row.paid_at || snap.paid_at || null
        snap.payer_id = row.payer_id || snap.payer_id || null
        return snap
      })
      .filter(Boolean) as SalarySnapshot[]

    return NextResponse.json({ success: true, data: snapshots })
  } catch (e: any) {
    console.error('GET /api/admin/payroll/snapshots/list error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
