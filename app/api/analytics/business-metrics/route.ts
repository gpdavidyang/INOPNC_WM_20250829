
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
      const from = searchParams.get('from')
      const to = searchParams.get('to')
      const siteFilter = searchParams.get('site')

      if (!from || !to) {
        return NextResponse.json({ error: 'Date range is required' }, { status: 400 })
      }

      const fromDate = new Date(from)
      const toDate = new Date(to)
      
      // Calculate previous period for comparison
      const periodDiff = toDate.getTime() - fromDate.getTime()
      const previousFromDate = new Date(fromDate.getTime() - periodDiff)
      const previousToDate = new Date(toDate.getTime() - periodDiff)

      // Build site filter based on user role and request
      let siteCondition = ''
      if (profile.role === 'site_manager' && profile.site_id) {
        siteCondition = `AND site_id = '${profile.site_id}'`
      } else if (siteFilter && siteFilter !== 'all') {
        siteCondition = `AND site_id = '${siteFilter}'`
      }

      const orgCondition = `organization_id = '${profile.organization_id}'`

      // Get total workers
      const { data: totalWorkersData } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .in('role', ['worker', 'site_manager'])

      // Get active workers (those who submitted reports in the period)
      const { data: activeWorkersData } = await supabase
        .from('daily_reports')
        .select('created_by')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())

      const activeWorkerIds = Array.from(new Set(activeWorkersData?.map((r: unknown) => r.created_by) || []))

      // Get daily reports count
      const { data: dailyReportsData } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())

      // Calculate daily reports completion rate
      const expectedReports = totalWorkersData?.length || 0
      const actualReports = dailyReportsData?.length || 0
      const dailyReportsCompletion = expectedReports > 0 ? (actualReports / expectedReports) * 100 : 0

      // Get material requests
      const { data: materialRequestsData } = await supabase
        .from('material_requests')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())

      // Get material usage (mock calculation - you can replace with actual logic)
      const materialUsage = Math.floor(Math.random() * 30) + 70 // 70-100%

      // Get equipment utilization (mock calculation)
      const equipmentUtilization = Math.floor(Math.random() * 25) + 65 // 65-90%

      // Get safety incidents
      const { data: safetyIncidentsData } = await supabase
        .from('safety_reports')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .eq('incident_type', 'accident')

      // Get previous period data for comparison
      const { data: prevActiveWorkersData } = await supabase
        .from('daily_reports')
        .select('created_by')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString())

      const prevActiveWorkerIds = Array.from(new Set(prevActiveWorkersData?.map((r: unknown) => r.created_by) || []))

      const { data: prevDailyReportsData } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString())

      const { data: prevMaterialRequestsData } = await supabase
        .from('material_requests')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString())

      const metrics = {
        totalWorkers: totalWorkersData?.length || 0,
        activeWorkers: activeWorkerIds.length,
        dailyReportsCount: dailyReportsData?.length || 0,
        dailyReportsCompletion: Math.round(dailyReportsCompletion * 10) / 10,
        materialRequests: materialRequestsData?.length || 0,
        materialUsage: materialUsage,
        equipmentUtilization: equipmentUtilization,
        safetyIncidents: safetyIncidentsData?.length || 0,
        previousPeriodComparison: {
          totalWorkers: totalWorkersData?.length || 0, // This stays the same
          activeWorkers: prevActiveWorkerIds.length,
          dailyReportsCount: prevDailyReportsData?.length || 0,
          materialRequests: prevMaterialRequestsData?.length || 0,
        }
      }

      return NextResponse.json({ metrics })
    } catch (error) {
      console.error('Error in business metrics API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)