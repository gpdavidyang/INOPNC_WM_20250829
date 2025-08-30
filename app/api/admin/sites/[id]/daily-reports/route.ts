import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date') // YYYY-MM format
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        total_workers,
        status,
        issues,
        created_at,
        updated_at,
        profiles!daily_reports_created_by_fkey(
          full_name,
          role
        ),
        sites!inner(
          id,
          name
        )
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
      submitted_reports: statsData?.filter(r => r.status === 'submitted').length || 0,
      draft_reports: statsData?.filter(r => r.status === 'draft').length || 0,
      total_workers: statsData?.reduce((sum, r) => sum + (r.total_workers || 0), 0) || 0
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