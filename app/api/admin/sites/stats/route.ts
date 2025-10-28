import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { computeSiteStats } from '@/lib/admin/site-stats'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/stats?ids=uuid1,uuid2,uuid3
// Returns: { success, data: Record<siteId, { daily_reports_count: number; total_labor_hours: number }> }
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const url = new URL(req.url)
    const idsParam = url.searchParams.getAll('ids')
    const idsStr = idsParam.length > 1 ? idsParam : idsParam[0]?.split(',') || []
    const siteIds = Array.from(new Set(idsStr.map(s => s.trim()).filter(Boolean)))

    if (siteIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids query parameter required' },
        { status: 400 }
      )
    }

    const data = await computeSiteStats(siteIds)
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('[sites/stats] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
