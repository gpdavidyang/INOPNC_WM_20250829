import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    let serviceSupabase = supabase
    try {
      serviceSupabase = createServiceClient()
    } catch (error) {
      console.warn(
        '[announcements] Service role client unavailable, falling back to session client'
      )
    }
    const {
      title,
      content,
      priority = 'normal', // low, normal, high, urgent
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

    const allowedPriorities = new Set(['low', 'normal', 'high', 'critical', 'urgent'])
    const normalizedPriority = allowedPriorities.has(priority) ? priority : 'normal'

    // Create announcement record
    const { data: announcement, error: createError } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        priority: normalizedPriority,
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

    // Create dispatch batch metadata for traceability
    const { data: dispatchRecord, error: dispatchError } = await serviceSupabase
      .from('announcement_dispatches')
      .insert({
        announcement_id: announcement.id,
        target_roles: targetRoles,
        target_site_ids: targetSiteIds,
        target_user_ids: [],
        created_by: authResult.userId,
        status: 'processing',
      })
      .select()
      .single()

    if (dispatchError) {
      console.error('Announcement dispatch creation failed:', dispatchError)
    }

    // Fire-and-forget push notifications to targeted users/sites/roles
    try {
      const origin = request.nextUrl.origin
      const payload = {
        notificationType: 'site_announcement',
        payload: {
          title: `📢 ${title}`,
          body: String(content || '').slice(0, 200),
          urgency: ['urgent', 'high'].includes(normalizedPriority) ? 'high' : 'low',
          data: {
            announcementId: announcement.id,
            priority: normalizedPriority,
          },
        },
        // include target filters if provided
        ...(targetSiteIds && targetSiteIds.length ? { siteIds: targetSiteIds } : {}),
        ...(targetRoles && targetRoles.length ? { roles: targetRoles } : {}),
      }
      await fetch(`${origin}/api/notifications/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward cookies to preserve session for requireApiAuth
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          ...payload,
          announcementId: announcement.id,
          dispatchId: dispatchRecord?.id,
          dispatchBatchId: dispatchRecord?.dispatch_batch_id,
        }),
      }).catch(() => {})
    } catch (e) {
      // Non-blocking
      console.warn('Announcement push dispatch failed:', e)
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
    const id = searchParams.get('id')
    const priority = searchParams.get('priority')
    const search = (searchParams.get('search') || '').trim()

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

    // If id is provided, fetch specific announcement first (then validate access)
    if (id) {
      let query = supabase.from('announcements').select('*').eq('id', id).eq('is_active', true)
      const { data: items, error: fetchError } = await query.limit(1)
      if (fetchError) {
        console.error('Error fetching announcement by id:', fetchError)
        return NextResponse.json({ success: true, announcements: [] })
      }
      const announcement = (items || [])[0]
      if (!announcement) {
        return NextResponse.json({ success: true, announcements: [] })
      }
      // Role filter for non-admins
      const roleAllowed =
        !announcement?.target_roles ||
        announcement.target_roles.length === 0 ||
        ['admin', 'system_admin'].includes(profile.role || '') ||
        announcement.target_roles.includes(profile.role ?? '')
      if (!roleAllowed) {
        return NextResponse.json({ success: true, announcements: [] })
      }
      // Site access filter: if announcement targets specific sites, ensure user has access
      if (Array.isArray(announcement?.target_sites) && announcement.target_sites.length > 0) {
        const targeted: string[] = announcement.target_sites
        let hasAccess = false
        if (profile.role === 'worker' || profile.role === 'site_manager') {
          hasAccess = !!profile.site_id && targeted.includes(profile.site_id)
        } else if (authResult.isRestricted) {
          // restricted org: check if any of the org sites overlap
          const { data: orgSites } = await supabase
            .from('sites')
            .select('id')
            .eq('organization_id', authResult.restrictedOrgId)
          const orgSiteIds = (orgSites || []).map(s => (s as { id: string }).id)
          hasAccess = orgSiteIds.some(sid => targeted.includes(sid))
        } else {
          // admins can access
          hasAccess = true
        }
        if (!hasAccess) {
          return NextResponse.json({ success: true, announcements: [] })
        }
      }
      return NextResponse.json({ success: true, announcements: [announcement] })
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

      const siteFilters = accessibleSiteIds.map(site => `target_sites.cs.{${site}}`).join(',')

      query = query.or(['target_sites.is.null', siteFilters].filter(Boolean).join(','))
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
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
