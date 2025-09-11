import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      case 'daily':
        startDate = now.toISOString().split('T')[0]
        endDate = startDate
        break
      case 'weekly':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
    }

    // Get partner's sites with contract information
    const { data: partnerSites, error: sitesError } = await supabase
      .from('site_partners')
      .select(`
        site_id,
        contract_value,
        assigned_date,
        sites:site_id(
          id,
          name,
          address,
          status,
          start_date,
          end_date
        )
      `)
      .eq('partner_company_id', profile.partner_company_id)

    if (sitesError) {
      console.error('Error fetching partner sites:', sitesError)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    if (!partnerSites || partnerSites.length === 0) {
      return NextResponse.json([])
    }

    // Get labor data for each site
    const siteLaborPromises = partnerSites.map(async (sitePartner) => {
      const site = sitePartner.sites
      if (!site) return null

      // Get labor hours for this site
      const { data: laborData, error: laborError } = await supabase
        .from('work_records')
        .select('work_date, work_hours, labor_hours, overtime_hours')
        .eq('site_id', site.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false })

      if (laborError) {
        console.error(`Error fetching labor data for site ${site.id}:`, laborError)
        return null
      }

      // Calculate totals
      const totalWorkHours = laborData?.reduce((sum, record) => sum + (Number(record.work_hours) || 0), 0) || 0
      const totalLaborHours = laborData?.reduce((sum, record) => sum + (Number(record.labor_hours) || 0), 0) || 0

      // Get unique work dates for calculating working days
      const uniqueDates = new Set(laborData?.map(record => record.work_date) || [])
      const workingDays = uniqueDates.size

      // Calculate average daily hours
      const averageDailyHours = workingDays > 0 ? (totalLaborHours || totalWorkHours) / workingDays : 0

      // Get most recent work data
      const recentWork = laborData?.[0]
      const recentWorkDate = recentWork?.work_date || startDate
      const recentDailyHours = recentWork ? (Number(recentWork.labor_hours) || Number(recentWork.work_hours) || 0) : 0

      return {
        id: site.id,
        name: site.name,
        address: site.address,
        status: site.status || 'active',
        totalLaborHours: totalLaborHours || totalWorkHours,
        averageDailyHours,
        recentWorkDate,
        recentDailyHours,
        contractValue: sitePartner.contract_value,
        assignedDate: sitePartner.assigned_date,
        workingDays
      }
    })

    const siteLabor = await Promise.all(siteLaborPromises)
    const validSiteLabor = siteLabor.filter(site => site !== null)

    // Sort by total labor hours descending
    validSiteLabor.sort((a, b) => (b?.totalLaborHours || 0) - (a?.totalLaborHours || 0))

    return NextResponse.json({
      sites: validSiteLabor,
      period,
      dateRange: { startDate, endDate },
      totalCount: validSiteLabor.length
    })

  } catch (error) {
    console.error('Partner site labor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}