import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date') // YYYY-MM format
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query - simplified to avoid foreign key issues
    let query = supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        component_name,
        work_process,
        work_section,
        total_workers,
        npc1000_incoming,
        npc1000_used,
        npc1000_remaining,
        status,
        issues,
        created_at,
        updated_at,
        created_by
      `)
      .eq('site_id', siteId)
      .order('work_date', { ascending: false })
      .limit(limit)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (date) {
      // Filter by year-month (YYYY-MM)
      const startDate = `${date}-01`
      const endDate = `${date}-31` // Rough end date, DB will handle
      query = query.gte('work_date', startDate).lte('work_date', endDate)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Daily reports query error:', error)
      return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
    }

    // Get additional statistics for the site
    const { data: statsData } = await supabase
      .from('daily_reports')
      .select('status, total_workers')
      .eq('site_id', siteId)

    const statistics = {
      total_reports: statsData?.length || 0,
      submitted_reports: statsData?.filter((r: unknown) => r.status === 'submitted').length || 0,
      draft_reports: statsData?.filter((r: unknown) => r.status === 'draft').length || 0,
      total_workers: statsData?.reduce((sum: unknown, r: unknown) => sum + (r.total_workers || 0), 0) || 0
    }

    return NextResponse.json({
      success: true,
      data: reports || [],
      statistics,
      filters: {
        site_id: siteId,
        status: status || 'all',
        date: date || null,
        limit
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
