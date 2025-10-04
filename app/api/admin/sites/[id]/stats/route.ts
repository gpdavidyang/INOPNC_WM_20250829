import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/sites/:id/stats
 * Returns: { daily_reports_count, total_labor_hours }
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId)
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })

    const service = createServiceRoleClient()

    // Count daily reports for this site
    const { count: reportsCount } = await service
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)

    // Sum total labor via work_records (fallback uses work_hours/8 if labor_hours is null)
    let from = 0
    const PAGE_SIZE = 1000
    let totalHours = 0
    let iterations = 0
    while (true) {
      const { data, error } = await service
        .from('work_records')
        .select('labor_hours, work_hours')
        .eq('site_id', siteId)
        .range(from, from + PAGE_SIZE - 1)
      if (error) {
        console.error('[admin/sites/:id/stats] work_records error:', error)
        break
      }
      if (!data || data.length === 0) break
      data.forEach(r => {
        const labor = Number((r as any).labor_hours) || 0
        const work = Number((r as any).work_hours) || 0
        totalHours += labor > 0 ? labor : work
      })
      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
      iterations += 1
      if (iterations > 50) break
    }
    const totalManDays = Number((totalHours / 8).toFixed(1))

    return NextResponse.json({
      success: true,
      data: {
        daily_reports_count: reportsCount || 0,
        total_labor_hours: totalManDays, // UI expects man-days style metric
      },
    })
  } catch (e) {
    console.error('[admin/sites/:id/stats] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
