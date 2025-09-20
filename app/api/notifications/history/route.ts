import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const notificationType = searchParams.get('type')
    const status = searchParams.get('status')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('notification_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', authResult.userId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (notificationType) {
      query = query.eq('notification_type', notificationType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      // If table doesn't exist, return empty array instead of throwing error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({
          notifications: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        })
      }
      throw error
    }

    // Get engagement data for these notifications
    const notificationIds = notifications?.map((n: unknown) => n.id) || []
    const { data: engagements } = await supabase
      .from('notification_engagement')
      .select('*')
      .in('notification_id', notificationIds)
      .eq('user_id', authResult.userId)

    // Map engagement data to notifications
    const notificationsWithEngagement = notifications?.map((notification: unknown) => {
      const engagement = engagements?.filter((e: Event) => e.notification_id === notification.id) || []
      return {
        ...notification,
        engagement: {
          clicked: engagement.some((e: Event) => e.engagement_type === 'notification_clicked'),
          deepLinked: engagement.some((e: Event) => e.engagement_type === 'deep_link_navigation'),
          actionPerformed: engagement.some((e: Event) => e.engagement_type === 'action_performed'),
          lastEngagement: engagement.sort((a: unknown, b: unknown) => 
            new Date(b.engaged_at).getTime() - new Date(a.engaged_at).getTime()
          )[0]?.engaged_at
        }
      }
    })

    return NextResponse.json({
      notifications: notificationsWithEngagement || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: unknown) {
    console.error('Notification history error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notification history',
      details: error.message 
    }, { status: 500 })
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { notificationId, action } = await request.json()

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Notification ID and action are required' }, { status: 400 })
    }

    // Update notification log based on action
    const updates: unknown = {}
    
    switch (action) {
      case 'read':
        updates.read_at = new Date().toISOString()
        break
      case 'delete':
        updates.deleted_at = new Date().toISOString()
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('notification_logs')
      .update(updates)
      .eq('id', notificationId)
      .eq('user_id', authResult.userId)

    if (updateError) {
      throw updateError
    }

    // Log engagement
    await supabase
      .from('notification_engagement')
      .insert({
        user_id: authResult.userId,
        notification_id: notificationId,
        engagement_type: action === 'read' ? 'notification_clicked' : 'notification_dismissed',
        engaged_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Notification update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update notification',
      details: error.message 
    }, { status: 500 })
  }
}
