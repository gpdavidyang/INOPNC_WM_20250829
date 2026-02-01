import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const svc = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')

    // 1. Build the base worklog filter
    let worklogQuery = svc.from('daily_reports').select('id')
    if (siteId && siteId !== 'all') worklogQuery = worklogQuery.eq('site_id', siteId)
    if (startDate) worklogQuery = worklogQuery.gte('work_date', startDate)
    if (endDate) worklogQuery = worklogQuery.lte('work_date', endDate)
    if (status && status !== 'all') {
      if (status === 'approved') {
        worklogQuery = worklogQuery.in('status', ['approved', 'submitted', 'completed'])
      } else if (status === 'draft') {
        worklogQuery = worklogQuery.in('status', ['draft', 'pending'])
      } else {
        worklogQuery = worklogQuery.eq('status', status)
      }
    }

    const { data: matchedWorklogs, error: wlError } = await worklogQuery
    if (wlError) throw wlError
    const matchedIds = (matchedWorklogs || []).map(w => w.id)
    const matchedSet = new Set(matchedIds)

    if (matchedIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { photoCount: 0, drawingCount: 0, linkedWorklogCount: 0 },
      })
    }

    // 2. Count Photos & Drawings using the Unified View
    // This view handles deduplication and multiple sources automatically
    const [photoRes, drawingRes] = await Promise.all([
      svc
        .from('daily_report_media_links_view')
        .select('media_id', { count: 'exact', head: true })
        .in('daily_report_id', matchedIds)
        .eq('media_type', 'photo'),
      svc
        .from('daily_report_media_links_view')
        .select('media_id', { count: 'exact', head: true })
        .in('daily_report_id', matchedIds)
        .eq('media_type', 'drawing'),
    ])

    return NextResponse.json({
      success: true,
      data: {
        photoCount: photoRes.count || 0,
        drawingCount: drawingRes.count || 0,
        linkedWorklogCount: matchedIds.length,
      },
    })
  } catch (error: any) {
    console.error('[media/stats] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
