import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

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

    const svc = createServiceRoleClient()

    // 1) Daily reports count per site (fetch rows and reduce client-side for portability)
    const { data: drRows, error: drErr } = await svc
      .from('daily_reports')
      .select('id, site_id')
      .in('site_id', siteIds)

    if (drErr) {
      console.error('[sites/stats] daily_reports error:', drErr)
      return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 })
    }

    const reportCountMap = new Map<string, number>()
    for (const row of drRows || []) {
      const sid = String((row as any).site_id)
      reportCountMap.set(sid, (reportCountMap.get(sid) || 0) + 1)
    }

    // 2) Total labor hours (man-days) per site via work_records
    const { data: wrRows, error: wrErr } = await svc
      .from('work_records')
      .select('site_id, labor_hours, work_hours')
      .in('site_id', siteIds)

    if (wrErr) {
      console.error('[sites/stats] work_records error:', wrErr)
      return NextResponse.json({ success: false, error: 'Failed to load labor' }, { status: 500 })
    }

    const laborMap = new Map<string, number>()
    for (const row of wrRows || []) {
      const sid = String((row as any).site_id)
      const labor = Number((row as any).labor_hours) || 0
      const hours = Number((row as any).work_hours) || 0
      const add = labor > 0 ? labor : hours > 0 ? hours / 8 : 0
      laborMap.set(sid, Number(((laborMap.get(sid) || 0) + add).toFixed(1)))
    }

    const out: Record<string, { daily_reports_count: number; total_labor_hours: number }> = {}
    for (const id of siteIds) {
      out[id] = {
        daily_reports_count: reportCountMap.get(id) || 0,
        total_labor_hours: laborMap.get(id) || 0,
      }
    }

    return NextResponse.json({ success: true, data: out })
  } catch (e) {
    console.error('[sites/stats] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
