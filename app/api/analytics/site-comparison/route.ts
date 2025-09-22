import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { parseISO, differenceInCalendarDays } from 'date-fns'

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

      if (!['admin', 'system_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const from = searchParams.get('from')
      const to = searchParams.get('to')

      if (!from || !to) {
        return NextResponse.json({ error: 'Date range is required' }, { status: 400 })
      }

      const fromDate = parseISO(from)
      const toDate = parseISO(to)

      if (differenceInCalendarDays(toDate, fromDate) < 0) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
      }

      if (!organizationId) {
        return NextResponse.json({ comparisonData: { siteNames: [], metrics: { workerCount: [], dailyReports: [], materialUsage: [], productivity: [] } } })
      }

      let allowedSiteIds: string[] | undefined

      if (restrictedOrgId) {
        const { data: orgSites, error: orgSitesError } = await supabase
          .from('sites')
          .select('id')
          .eq('organization_id', restrictedOrgId)
          .eq('is_active', true)

        if (orgSitesError) {
          console.error('Site comparison: failed to load restricted sites', orgSitesError)
          return NextResponse.json({ error: 'Unable to determine accessible sites' }, { status: 500 })
        }

        allowedSiteIds = (orgSites || []).map(site => (site as { id: string }).id)

        if (!allowedSiteIds || allowedSiteIds.length === 0) {
          return NextResponse.json({ comparisonData: { siteNames: [], metrics: { workerCount: [], dailyReports: [], materialUsage: [], productivity: [] } } })
        }
      }

      // Get all active sites for the organization
      let sitesQuery = supabase
        .from('sites')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (allowedSiteIds && allowedSiteIds.length > 0) {
        sitesQuery = sitesQuery.in('id', allowedSiteIds)
      }

      const { data: sites } = await sitesQuery.order('name')

      if (!sites || sites.length === 0) {
        return NextResponse.json({ 
          comparisonData: {
            siteNames: [],
            metrics: {
              workerCount: [],
              dailyReports: [],
              materialUsage: [],
              productivity: []
            }
          }
        })
      }

      const siteNames = sites.map((site: unknown) => site.name)
      const siteIds = sites.map((site: unknown) => site.id)

      // Get worker count per site
      const workerCountPromises = siteIds.map(async (siteId: string) => {
        const { data: reports } = await supabase
          .from('daily_reports')
          .select('created_by')
          .eq('site_id', siteId)
          .gte('created_at', fromDate.toISOString())
          .lte('created_at', toDate.toISOString())

        const uniqueWorkers = new Set(reports?.map((r: unknown) => r.created_by) || [])
        return uniqueWorkers.size
      })

      // Get daily reports count per site
      const dailyReportsPromises = siteIds.map(async (siteId: string) => {
        const { data: reports } = await supabase
          .from('daily_reports')
          .select('id')
          .eq('site_id', siteId)
          .gte('created_at', fromDate.toISOString())
          .lte('created_at', toDate.toISOString())

        return reports?.length || 0
      })

      // Wait for all promises to resolve
      const [workerCounts, dailyReportsCounts] = await Promise.all([
        Promise.all(workerCountPromises),
        Promise.all(dailyReportsPromises)
      ])

      // Generate mock data for material usage and productivity
      const materialUsage = siteIds.map(() => 0)
      const productivity = siteIds.map(() => 0)

      const comparisonData = {
        siteNames,
        metrics: {
          workerCount: workerCounts,
          dailyReports: dailyReportsCounts,
          materialUsage,
          productivity
        }
      }

      return NextResponse.json({ comparisonData })
    } catch (error) {
      console.error('Error in site comparison API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
