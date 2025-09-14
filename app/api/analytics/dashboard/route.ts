import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AsyncState, ApiResponse } from '@/types/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    // Check if user has permission to view analytics
    if (!['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Build query based on user role
    let query = supabase
      .from('analytics_daily_stats')
      .select(`
        *,
        site:sites(id, name, description)
      `)
      .gte('stat_date', startDate)
      .lte('stat_date', endDate)
      .order('stat_date', { ascending: false })

    // Filter by organization
    if (profile.role !== 'system_admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    // Filter by site if specified
    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // For site managers, only show their assigned sites
    if (profile.role === 'site_manager') {
      const { data: assignedSites } = await supabase
        .from('site_members')
        .select('site_id')
        .eq('user_id', user.id)
        .eq('role', 'site_manager')

      if (assignedSites && assignedSites.length > 0) {
        const siteIds = assignedSites.map((s: unknown) => s.site_id)
        query = query.in('site_id', siteIds)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Calculate summary statistics
    const summary = {
      totalReports: data?.reduce((sum: unknown, d: unknown) => sum + d.total_reports, 0) || 0,
      avgCompletionRate: data?.length > 0 
        ? (data.reduce((sum: unknown, d: unknown) => sum + d.report_completion_rate, 0) / data.length).toFixed(2)
        : 0,
      avgAttendanceRate: data?.length > 0
        ? (data.reduce((sum: unknown, d: unknown) => sum + d.attendance_rate, 0) / data.length).toFixed(2)
        : 0,
      totalLaborHours: data?.reduce((sum: unknown, d: unknown) => sum + Number(d.total_labor_hours), 0).toFixed(2) || 0,
      avgProductivityScore: data?.length > 0
        ? (data.reduce((sum: unknown, d: unknown) => sum + d.productivity_score, 0) / data.length).toFixed(2)
        : 0,
      totalNPC1000Used: data?.reduce((sum: unknown, d: unknown) => sum + Number(d.npc1000_used), 0).toFixed(2) || 0,
    }

    return NextResponse.json({
      data,
      summary,
      dateRange: { startDate, endDate },
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}