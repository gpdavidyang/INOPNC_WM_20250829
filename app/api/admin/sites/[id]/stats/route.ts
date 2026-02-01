import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { computeSiteStats } from '@/lib/admin/site-stats'

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

    const statsMap = await computeSiteStats([siteId])
    const stats = statsMap[siteId] || { daily_reports_count: 0, total_labor_hours: 0 }

    return NextResponse.json({ success: true, data: stats })
  } catch (e) {
    console.error('[admin/sites/:id/stats] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
