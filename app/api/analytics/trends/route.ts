import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple wrapper for API monitoring
function withApiMonitoring(handler: Function) {
  return async (request: NextRequest) => {
    return handler(request)
  }
}


export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id, site_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Check if user has access to analytics
      if (!['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
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

      // Build site filter based on user role and request
      let siteCondition = ''
      if (profile.role === 'site_manager' && profile.site_id) {
        siteCondition = `AND site_id = '${profile.site_id}'`
      } else if (siteFilter && siteFilter !== 'all') {
        siteCondition = `AND site_id = '${siteFilter}'`
      }

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
            .select('created_at')
            .eq('organization_id', profile.organization_id)
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())

          // Group by day and count
          const countsByDay = dateLabels.map((label: unknown) => {
            const day = format(parseISO(from), 'yyyy-MM-dd')
            const dayReports = reports?.filter((r: unknown) => 
              format(new Date(r.created_at), 'M/d') === label
            ) || []
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
                .select('created_by')
                .eq('organization_id', profile.organization_id)
                .gte('created_at', dayStart.toISOString())
                .lte('created_at', dayEnd.toISOString())

              const uniqueWorkers = new Set(dayReports?.map((r: unknown) => r.created_by) || [])
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
            .select('created_at')
            .eq('organization_id', profile.organization_id)
            .eq('incident_type', 'accident')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())

          const countsByDay = dateLabels.map((label: unknown) => {
            const dayIncidents = incidents?.filter((i: unknown) => 
              format(new Date(i.created_at), 'M/d') === label
            ) || []
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