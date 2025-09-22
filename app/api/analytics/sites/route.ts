import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

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

      if (!organizationId) {
        return NextResponse.json({ sites: [] })
      }

      if (!['admin', 'system_admin', 'site_manager'].includes(userRole)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      let allowedSiteIds: string[] | undefined

      if (restrictedOrgId) {
        const { data: orgSites, error: orgSitesError } = await supabase
          .from('sites')
          .select('id')
          .eq('organization_id', restrictedOrgId)

        if (orgSitesError) {
          console.error('Analytics sites: failed to load restricted sites', orgSitesError)
          return NextResponse.json({ sites: [] })
        }

        allowedSiteIds = (orgSites || []).map(site => (site as { id: string }).id)

        if (!allowedSiteIds || allowedSiteIds.length === 0) {
          return NextResponse.json({ sites: [] })
        }
      }

      if (userRole === 'site_manager') {
        const { data: assignedSites, error: assignedError } = await supabase
          .from('site_members')
          .select('site_id')
          .eq('user_id', authResult.userId)
          .eq('role', 'site_manager')

        let siteIds = (assignedSites || [])
          .map(record => (record as { site_id: string | null }).site_id)
          .filter((value): value is string => !!value)

        if (siteIds.length === 0 && profile.site_id) {
          siteIds = [profile.site_id]
        }

        if (assignedError) {
          console.warn('Analytics sites: site membership lookup failed', assignedError)
        }

        allowedSiteIds = allowedSiteIds
          ? allowedSiteIds.filter(id => siteIds.includes(id))
          : siteIds

        if (!allowedSiteIds || allowedSiteIds.length === 0) {
          return NextResponse.json({ sites: [] })
        }
      }

      let siteQuery = supabase
        .from('sites')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (allowedSiteIds && allowedSiteIds.length > 0) {
        siteQuery = siteQuery.in('id', allowedSiteIds)
      }

      const { data: sites, error } = await siteQuery.order('name')

      if (error) {
        console.error('Error fetching sites:', error)
        return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
      }

      return NextResponse.json({ sites: sites || [] })
    } catch (error) {
      console.error('Error in sites API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
