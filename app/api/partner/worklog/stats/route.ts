import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    const service = createServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id') || undefined
    const yearMonth = searchParams.get('yearMonth') // 'YYYY-MM'

    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return NextResponse.json({ error: 'yearMonth is required (YYYY-MM)' }, { status: 400 })
    }

    const [y, m] = yearMonth.split('-').map(v => parseInt(v, 10))
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0) // last day
    const startDate = start.toISOString().split('T')[0]
    const endDate = end.toISOString().split('T')[0]

    // Partner access: allowed sites only
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id')
      .eq('id', auth.userId)
      .maybeSingle()

    let allowedSiteIds: string[] | null = null
    if (profile?.role === 'customer_manager' || profile?.role === 'partner') {
      if (!profile.partner_company_id) {
        return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
      }
      const { data: mappings } = await supabase
        .from('partner_site_mappings')
        .select('site_id')
        .eq('partner_company_id', profile.partner_company_id)
        .eq('is_active', true)
      allowedSiteIds = (mappings || []).map(r => r.site_id).filter(Boolean)
      if (allowedSiteIds.length === 0) {
        return NextResponse.json({ success: true, data: { yearMonth, stats: {} } })
      }
    }

    let query = service
      .from('daily_reports')
      .select('work_date', { count: 'exact' })
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (siteId) query = query.eq('site_id', siteId)
    if (allowedSiteIds) query = query.in('site_id', allowedSiteIds)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Group by date (client-side since we used select)
    const stats: Record<string, number> = {}
    ;(data || []).forEach((row: any) => {
      const d = row.work_date
      if (!d) return
      stats[d] = (stats[d] || 0) + 1
    })

    return NextResponse.json({ success: true, data: { yearMonth, stats } })
  } catch (e) {
    console.error('[partner/worklog/stats] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
