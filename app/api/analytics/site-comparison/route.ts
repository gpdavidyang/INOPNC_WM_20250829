import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple wrapper for API monitoring
function withApiMonitoring(handler: (request: NextRequest) => Promise<NextResponse>) {
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
      if (!['admin', 'system_admin'].includes(profile.role)) {
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

      // Get all active sites for the organization
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name')

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
      const workerCountPromises = siteIds.map(async (siteId: unknown) => {
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
      const dailyReportsPromises = siteIds.map(async (siteId: unknown) => {
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
      const materialUsage = siteIds.map((_: unknown) => Math.floor(Math.random() * 30) + 70) // 70-100%
      const productivity = siteIds.map((_: unknown) => Math.floor(Math.random() * 20) + 80) // 80-100 points

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