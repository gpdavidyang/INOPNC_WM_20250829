import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    if (!['admin', 'system_admin', 'site_manager'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const siteId = params.id
    const supabase = createClient()

    // Count daily reports for this site
    const { count: dailyReportsCount } = await supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)

    // Sum labor_hours from work_records (총공수)
    let totalLaborHours = 0
    try {
      const { data: records } = await supabase
        .from('work_records')
        .select('labor_hours')
        .eq('site_id', siteId)
      totalLaborHours = (records || []).reduce(
        (sum: number, r: any) => sum + (Number(r.labor_hours) || 0),
        0
      )
    } catch (_) {
      totalLaborHours = 0
    }

    return NextResponse.json({
      success: true,
      data: {
        daily_reports_count: dailyReportsCount || 0,
        total_labor_hours: Number(totalLaborHours.toFixed(2)),
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
