import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiMonitoring } from '@/lib/monitoring/api-monitoring'

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

      // Build site query based on user role
      let siteQuery = supabase
        .from('sites')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)

      // If user is a site manager, only show their site
      if (profile.role === 'site_manager' && profile.site_id) {
        siteQuery = siteQuery.eq('id', profile.site_id)
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
  },
  { name: 'getSites' }
)