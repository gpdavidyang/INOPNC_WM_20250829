import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const {
      title,
      content,
      priority = 'medium', // low, medium, high, urgent
      siteIds = [],
      targetRoles = [], // specific roles to notify
      expiresAt,
      attachments = [],
    } = await request.json()

    // Verify user authentication
    // Check if user has permission to create announcements
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate site access for site managers
    let targetSiteIds = siteIds
    if (profile.role === 'site_manager') {
      // Site managers can only announce to their own site
      targetSiteIds = [profile.site_id]
    }

    // Create announcement record
    const { data: announcement, error: createError } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        priority,
        target_sites: targetSiteIds,
        target_roles: targetRoles,
        created_by: authResult.userId,
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating announcement:', createError)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    })
  } catch (error) {
    console.error('Announcement creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create announcement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const priority = searchParams.get('priority')

    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      console.error('Announcements: Profile lookup failed', profileError)
      return NextResponse.json({
        success: true,
        announcements: [],
      })
    }

    let accessibleSiteIds: string[] | null = null
    if (authResult.isRestricted) {
      const restrictedOrgId = authResult.restrictedOrgId
      if (!restrictedOrgId) {
        return NextResponse.json({ success: true, announcements: [] })
      }
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', restrictedOrgId)

      if (sitesError) {
        console.error('Announcements: Failed to load accessible sites', sitesError)
        return NextResponse.json({
          success: true,
          announcements: [],
        })
      }

      accessibleSiteIds = (sites || []).map(site => (site as { id: string }).id)

      if (siteId && !accessibleSiteIds.includes(siteId)) {
        return NextResponse.json({ success: true, announcements: [] })
      }
    }

    let query = supabase.from('announcements').select('*').eq('is_active', true)

    if (siteId) {
      query = query.contains('target_sites', [siteId])
    } else if (profile.role === 'worker' || profile.role === 'site_manager') {
      if (profile.site_id) {
        query = query.contains('target_sites', [profile.site_id])
      } else {
        return NextResponse.json({ success: true, announcements: [] })
      }
    } else if (authResult.isRestricted) {
      if (!accessibleSiteIds || accessibleSiteIds.length === 0) {
        return NextResponse.json({ success: true, announcements: [] })
      }

      const siteFilters = accessibleSiteIds
        .map(site => `target_sites.cs.{${site}}`)
        .join(',')

      query = query.or(['target_sites.is.null', siteFilters].filter(Boolean).join(','))
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    query = query.order('created_at', { ascending: false })

    const { data: announcements, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching announcements:', fetchError)
      return NextResponse.json({
        success: true,
        announcements: [],
      })
    }

    const filteredAnnouncements = !['admin', 'system_admin'].includes(profile.role || '')
      ? (announcements || []).filter(announcement => {
          if (!announcement?.target_roles || announcement.target_roles.length === 0) {
            return true
          }
          return announcement.target_roles.includes(profile.role ?? '')
        })
      : announcements || []

    return NextResponse.json({
      success: true,
      announcements: filteredAnnouncements,
    })
  } catch (error) {
    console.error('Get announcements error:', error)
    // Return empty list instead of 500 to prevent infinite error loops
    return NextResponse.json({
      success: true,
      announcements: [],
    })
  }
}
