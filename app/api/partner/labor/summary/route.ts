
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, partner_company_id, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.partner_company_id) {
      return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'monthly'
    
    let startDate: string
    let endDate: string
    
    const now = new Date()
    switch (period) {
      case 'daily': {
        startDate = now.toISOString().split('T')[0]
        endDate = startDate
        break
        }
      case 'weekly': {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
        }
      case 'monthly':
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
        }
    }

    // Get partner's accessible sites
    const { data: partnerSites, error: sitesError } = await supabase
      .from('site_partners')
      .select(`
        site_id,
        sites:site_id(id, name, status)
      `)
      .eq('partner_company_id', profile.partner_company_id)

    if (sitesError) {
      console.error('Error fetching partner sites:', sitesError)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    const siteIds = partnerSites?.map((sp: unknown) => sp.site_id) || []
    const totalSites = partnerSites?.length || 0
    const activeSites = partnerSites?.filter((sp: unknown) => sp.sites?.status === 'active').length || 0

    if (siteIds.length === 0) {
      return NextResponse.json({
        totalSites: 0,
        activeSites: 0,
        totalLaborHours: 0,
        averageDailyHours: 0,
        overtimeHours: 0,
        workingDays: 0
      })
    }

    // Get labor hours data
    const { data: laborData, error: laborError } = await supabase
      .from('work_records')
      .select('work_date, work_hours, labor_hours, overtime_hours')
      .in('site_id', siteIds)
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (laborError) {
      console.error('Error fetching labor data:', laborError)
      return NextResponse.json({ error: 'Failed to fetch labor data' }, { status: 500 })
    }

    // Calculate statistics
    const totalWorkHours = laborData?.reduce((sum: number, record: unknown) => sum + (Number(record.work_hours) || 0), 0) || 0
    const totalLaborHours = laborData?.reduce((sum: number, record: unknown) => sum + (Number(record.labor_hours) || 0), 0) || 0
    const totalOvertimeHours = laborData?.reduce((sum: number, record: unknown) => sum + (Number(record.overtime_hours) || 0), 0) || 0
    
    // Get unique work dates for calculating working days
    const uniqueDates = new Set(laborData?.map((record: unknown) => record.work_date) || [])
    const workingDays = uniqueDates.size

    // Calculate average daily hours
    const averageDailyHours = workingDays > 0 ? (totalLaborHours || totalWorkHours) / workingDays : 0

    return NextResponse.json({
      totalSites,
      activeSites,
      totalLaborHours: totalLaborHours || totalWorkHours,
      averageDailyHours,
      overtimeHours: totalOvertimeHours,
      workingDays,
      period,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error('Partner labor summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}