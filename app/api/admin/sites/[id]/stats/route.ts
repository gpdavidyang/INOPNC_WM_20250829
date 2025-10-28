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

    // Sum total labor in man-days via work_records
    // - labor_hours column stores man-days (1.0 = 1 공수 = 8 hours)
    // - work_hours column stores hours; when labor_hours is null/0, convert hours → man-days
    let from = 0
    const PAGE_SIZE = 1000
    let totalManDays = 0
    let iterations = 0
    while (true) {
      const { data, error } = await service
        .from('work_records')
        .select('labor_hours, work_hours')
        .eq('site_id', siteId)
        .not('daily_report_id', 'is', null)
        .range(from, from + PAGE_SIZE - 1)
      if (error) {
        console.error('[admin/sites/:id/stats] work_records error:', error)
        break
      }
      if (!data || data.length === 0) break
      data.forEach(r => {
        const labor = Number((r as any).labor_hours) || 0 // already man-days
        const work = Number((r as any).work_hours) || 0 // hours
        // If labor is present, use it directly; otherwise use hours / 8
        totalManDays += labor > 0 ? labor : work > 0 ? work / 8 : 0
      })
      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
      iterations += 1
      if (iterations > 50) break
    }
    totalManDays = Number(totalManDays.toFixed(1))

    return NextResponse.json({
      success: true,
      data: {
        daily_reports_count: reportsCount || 0,
        total_labor_hours: totalManDays, // UI expects man-days (공수)
      },
    })
  } catch (e) {
    console.error('[admin/sites/:id/stats] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
