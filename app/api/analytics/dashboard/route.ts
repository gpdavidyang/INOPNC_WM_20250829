import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, site_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userRole = profile.role ?? authResult.role ?? 'worker'
    const restrictedOrgId = authResult.isRestricted ? authResult.restrictedOrgId ?? null : null
    const organizationId = restrictedOrgId ?? profile.organization_id ?? null

    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    if (!['site_manager', 'admin', 'system_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (!organizationId) {
      return NextResponse.json({
        data: [],
        summary: {
          totalReports: 0,
          avgCompletionRate: 0,
          avgAttendanceRate: 0,
          totalLaborHours: 0,
          avgProductivityScore: 0,
          totalNPC1000Used: 0,
        },
        dateRange: { startDate, endDate },
        count: 0,
      })
    }

    let allowedSiteIds: string[] | undefined

    if (restrictedOrgId) {
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', restrictedOrgId)

      if (sitesError) {
        console.error('Analytics dashboard: failed to load restricted sites', sitesError)
        return NextResponse.json({ error: 'Unable to determine accessible sites' }, { status: 500 })
      }

      allowedSiteIds = (sites || []).map(site => (site as { id: string }).id)

      if (!allowedSiteIds || allowedSiteIds.length === 0) {
        return NextResponse.json({
          data: [],
          summary: {
            totalReports: 0,
            avgCompletionRate: 0,
            avgAttendanceRate: 0,
            totalLaborHours: 0,
            avgProductivityScore: 0,
            totalNPC1000Used: 0,
          },
          dateRange: { startDate, endDate },
          count: 0,
        })
      }
    }

    if (userRole === 'site_manager') {
      const { data: assignedSites, error: assignedSitesError } = await supabase
        .from('site_members')
        .select('site_id')
        .eq('user_id', authResult.userId)
        .eq('role', 'site_manager')

      if (assignedSitesError) {
        console.warn('Analytics dashboard: site membership lookup failed', assignedSitesError)
      }

      const assignedIds = (assignedSites || [])
        .map(record => (record as { site_id: string | null }).site_id)
        .filter((value): value is string => !!value)

      if (assignedIds.length === 0 && profile.site_id) {
        assignedIds.push(profile.site_id)
      }

      allowedSiteIds = allowedSiteIds
        ? allowedSiteIds.filter(id => assignedIds.includes(id))
        : assignedIds

      if (!allowedSiteIds || allowedSiteIds.length === 0) {
        return NextResponse.json({ data: [], summary: {}, dateRange: { startDate, endDate }, count: 0 })
      }
    }

    if (siteId) {
      if (allowedSiteIds && !allowedSiteIds.includes(siteId)) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 })
      }
      allowedSiteIds = allowedSiteIds ? allowedSiteIds.filter(id => id === siteId) : [siteId]
    }

    let query = supabase
      .from('analytics_daily_stats')
      .select(
        `
        *,
        site:sites(id, name, description)
      `
      )
      .eq('organization_id', organizationId)
      .gte('stat_date', startDate)
      .lte('stat_date', endDate)

    if (allowedSiteIds && allowedSiteIds.length > 0) {
      query = query.in('site_id', allowedSiteIds)
    }

    query = query.order('stat_date', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    const dataset = (data || []) as Array<{
      total_reports?: number | null
      report_completion_rate?: number | null
      attendance_rate?: number | null
      total_labor_hours?: number | string | null
      productivity_score?: number | null
      npc1000_used?: number | string | null
    }>

    const count = dataset.length
    const totalReports = dataset.reduce((sum, record) => sum + (Number(record.total_reports) || 0), 0)
    const totalCompletionRate = dataset.reduce((sum, record) => sum + (Number(record.report_completion_rate) || 0), 0)
    const totalAttendanceRate = dataset.reduce((sum, record) => sum + (Number(record.attendance_rate) || 0), 0)
    const totalLaborHours = dataset.reduce((sum, record) => sum + (Number(record.total_labor_hours) || 0), 0)
    const totalProductivityScore = dataset.reduce((sum, record) => sum + (Number(record.productivity_score) || 0), 0)
    const totalNpcUsed = dataset.reduce((sum, record) => sum + (Number(record.npc1000_used) || 0), 0)

    const summary = {
      totalReports,
      avgCompletionRate: count > 0 ? (totalCompletionRate / count).toFixed(2) : 0,
      avgAttendanceRate: count > 0 ? (totalAttendanceRate / count).toFixed(2) : 0,
      totalLaborHours: totalLaborHours.toFixed(2),
      avgProductivityScore: count > 0 ? (totalProductivityScore / count).toFixed(2) : 0,
      totalNPC1000Used: totalNpcUsed.toFixed(2),
    }

    return NextResponse.json({
      data: dataset,
      summary,
      dateRange: { startDate, endDate },
      count,
    })

  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
