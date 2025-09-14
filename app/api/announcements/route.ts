import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { 
      title,
      content,
      priority = 'medium', // low, medium, high, urgent
      siteIds = [],
      targetRoles = [], // specific roles to notify
      expiresAt,
      attachments = []
    } = await request.json()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create announcements
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', user.id)
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
        site_ids: targetSiteIds,
        target_roles: targetRoles,
        expires_at: expiresAt,
        attachments,
        created_by: user.id,
        organization_id: profile.organization_id,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating announcement:', createError)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    // Get target workers based on sites and roles
    let workersQuery = supabase
      .from('profiles')
      .select('id, full_name, push_subscription, notification_preferences')
      .eq('status', 'active')

    if (targetSiteIds.length > 0) {
      workersQuery = workersQuery.in('site_id', targetSiteIds)
    }

    if (targetRoles.length > 0) {
      workersQuery = workersQuery.in('role', targetRoles)
    }

    const { data: targetWorkers } = await workersQuery

    if (targetWorkers?.length) {
      // Create notifications for all target workers
      const notifications = targetWorkers.map((worker: unknown) => ({
        user_id: worker.id,
        type: priority === 'urgent' ? 'error' : priority === 'high' ? 'warning' : 'info',
        title: `📢 ${title}`,
        message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        related_entity_type: 'announcement',
        related_entity_id: announcement.id,
        action_url: `/dashboard/announcements/${announcement.id}`,
        created_by: user.id
      }))

      await supabase
        .from('notifications')
        .insert(notifications)

      // Send push notifications
      try {
        await notificationHelpers.sendSiteAnnouncement(
          targetWorkers.map((w: unknown) => w.id),
          title,
          content,
          priority,
          announcement.id
        )
      } catch (error) {
        console.error('Failed to send push notifications:', error)
      }
    }

    // Log announcement creation
    await supabase
      .from('announcement_logs')
      .insert({
        announcement_id: announcement.id,
        action: 'created',
        performed_by: user.id,
        details: {
          target_sites: targetSiteIds,
          target_roles: targetRoles,
          recipients_count: targetWorkers?.length || 0
        }
      })

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement created and notifications sent',
      recipientsCount: targetWorkers?.length || 0
    })

  } catch (error: unknown) {
    console.error('Announcement creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create announcement',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status') || 'active'
    const priority = searchParams.get('priority')

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check site access and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('announcements')
      .select(`
        *,
        created_by_user:profiles!announcements_created_by_fkey(full_name),
        read_status:announcement_reads!left(read_at)
      `)
      .eq('status', status)

    // Filter by site
    if (siteId) {
      query = query.contains('site_ids', [siteId])
    } else if (profile.role === 'worker' || profile.role === 'site_manager') {
      // Workers and site managers only see announcements for their site
      query = query.contains('site_ids', [profile.site_id])
    }

    // Filter by priority
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Filter by role if user is not admin
    if (!['admin', 'system_admin'].includes(profile.role)) {
      query = query.or(`target_roles.is.null,target_roles.cs.{${profile.role}}`)
    }

    // Filter out expired announcements
    query = query.or('expires_at.is.null,expires_at.gt.now()')

    query = query.order('created_at', { ascending: false })

    const { data: announcements, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching announcements:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    // Mark announcements as read for the user
    const unreadIds = announcements
      ?.filter((a: unknown) => !a.read_status?.length)
      .map((a: unknown) => a.id) || []

    if (unreadIds.length > 0) {
      await supabase
        .from('announcement_reads')
        .insert(
          unreadIds.map((announcementId: unknown) => ({
            announcement_id: announcementId,
            user_id: user.id,
            read_at: new Date().toISOString()
          }))
        )
        .onConflict('announcement_id,user_id')
        .ignore()
    }

    return NextResponse.json({
      success: true,
      announcements: announcements || []
    })

  } catch (error: unknown) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ 
      error: 'Failed to get announcements',
      details: error.message 
    }, { status: 500 })
  }
}
