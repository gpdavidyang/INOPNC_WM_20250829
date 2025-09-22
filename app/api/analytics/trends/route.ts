import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { parseISO, eachDayOfInterval, format } from 'date-fns'

export const dynamic = 'force-dynamic'


// Simple wrapper for API monitoring
function withApiMonitoring(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    return handler(request)
  }
}


export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const authResult = await requireApiAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const supabase = createClient()

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id, site_id')
        .eq('id', authResult.userId)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const userRole = profile.role ?? authResult.role ?? 'worker'
      const restrictedOrgId = authResult.isRestricted ? authResult.restrictedOrgId ?? null : null
      const organizationId = restrictedOrgId ?? profile.organization_id ?? null

      if (!['admin', 'system_admin', 'site_manager'].includes(userRole)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type')
      const from = searchParams.get('from')
      const to = searchParams.get('to')
      const siteFilter = searchParams.get('site')

      if (!type || !from || !to) {
        return NextResponse.json({ error: 'Type and date range are required' }, { status: 400 })
      }

      const fromDate = parseISO(from)
      const toDate = parseISO(to)

      // Generate date labels for the chart
      const dateLabels = eachDayOfInterval({ start: fromDate, end: toDate })
        .map((date: unknown) => format(date, 'M/d'))

      let allowedSiteIds: string[] | undefined

      if (restrictedOrgId) {
        const { data: sites, error: sitesError } = await supabase
          .from('sites')
          .select('id')
          .eq('organization_id', restrictedOrgId)

        if (sitesError) {
          console.error('Trends: failed to load restricted sites', sitesError)
          return NextResponse.json({ error: 'Unable to determine accessible sites' }, { status: 500 })
        }

        allowedSiteIds = (sites || []).map(site => (site as { id: string }).id)

        if (!allowedSiteIds || allowedSiteIds.length === 0) {
          return NextResponse.json({
            trendData: {
              labels: dateLabels,
              datasets: [{ data: dateLabels.map(() => 0) }],
            },
          })
        }
      }

      if (userRole === 'site_manager') {
        if (profile.site_id) {
          allowedSiteIds = allowedSiteIds
            ? allowedSiteIds.filter(id => id === profile.site_id)
            : [profile.site_id]
        }
      }

      if (siteFilter && siteFilter !== 'all') {
        if (allowedSiteIds && !allowedSiteIds.includes(siteFilter)) {
          return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 })
        }
        allowedSiteIds = [siteFilter]
      }

      const siteFilterClause = allowedSiteIds && allowedSiteIds.length > 0
        ? (recordSiteId: string | null | undefined) => !recordSiteId || allowedSiteIds!.includes(recordSiteId)
        : (_: string | null | undefined) => true

      let trendData: unknown = {
        labels: dateLabels,
        datasets: [{
          data: []
        }]
      }

      switch (type) {
        case 'daily_reports': {
          const { data: reports } = await supabase
            .from('daily_reports')
            .select('created_at, site_id')
            .eq('organization_id', organizationId)
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())

          // Group by day and count
          const countsByDay = dateLabels.map((label: unknown) => {
            const dayReports = (reports || []).filter((r: any) =>
              format(new Date(r.created_at), 'M/d') === label && siteFilterClause(r.site_id ?? null)
            )
            return dayReports.length
          })

          trendData.datasets[0].data = countsByDay
          break
        }

        case 'worker_count': {
          // Get unique active workers per day
          const countsByDay = await Promise.all(
            dateLabels.map(async (label: unknown, index: unknown) => {
              const targetDate = eachDayOfInterval({ start: fromDate, end: toDate })[index]
              const dayStart = new Date(targetDate)
              dayStart.setHours(0, 0, 0, 0)
              const dayEnd = new Date(targetDate)
              dayEnd.setHours(23, 59, 59, 999)

              const { data: dayReports } = await supabase
                .from('daily_reports')
                .select('created_by, site_id')
                .eq('organization_id', organizationId)
                .gte('created_at', dayStart.toISOString())
                .lte('created_at', dayEnd.toISOString())

              const uniqueWorkers = new Set(
                (dayReports || [])
                  .filter((r: any) => siteFilterClause(r.site_id ?? null))
                  .map((r: any) => r.created_by)
              )
              return uniqueWorkers.size
            })
          )

          trendData.datasets[0].data = countsByDay
          break
        }

        case 'material_usage': {
          // Mock data for material usage trend
          const mockData = dateLabels.map((_: unknown) => Math.floor(Math.random() * 20) + 70)
          trendData.datasets[0].data = mockData
          break
        }

        case 'equipment_utilization': {
          // Mock data for equipment utilization trend
          const mockData = dateLabels.map((_: unknown) => Math.floor(Math.random() * 25) + 65)
          trendData.datasets[0].data = mockData
          break
        }

        case 'productivity_score': {
          // Mock data for productivity score trend
          const mockData = dateLabels.map((_: unknown) => Math.floor(Math.random() * 30) + 70)
          trendData.datasets[0].data = mockData
          break
        }

        case 'task_completion_rate': {
          // Mock data for task completion rate trend
          const mockData = dateLabels.map((_: unknown) => Math.floor(Math.random() * 20) + 75)
          trendData.datasets[0].data = mockData
          break
        }

        case 'safety_incidents': {
          // Get safety incidents per day
          const { data: incidents } = await supabase
            .from('safety_reports')
            .select('created_at, site_id')
            .eq('organization_id', organizationId)
            .eq('incident_type', 'accident')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())

          const countsByDay = dateLabels.map((label: unknown) => {
            const dayIncidents = (incidents || []).filter((i: any) =>
              format(new Date(i.created_at), 'M/d') === label && siteFilterClause(i.site_id ?? null)
            )
            return dayIncidents.length
          })

          trendData.datasets[0].data = countsByDay
          break
        }

        case 'safety_inspection_rate': {
          // Mock data for safety inspection rate trend
          const mockData = dateLabels.map((_: unknown) => Math.floor(Math.random() * 15) + 85)
          trendData.datasets[0].data = mockData
          break
        }

        default:
          return NextResponse.json({ error: 'Invalid trend type' }, { status: 400 })
      }

      return NextResponse.json({ trendData })
    } catch (error) {
      console.error('Error in trends API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
