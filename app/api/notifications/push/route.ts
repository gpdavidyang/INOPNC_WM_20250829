
import webpush from 'web-push'

// Configure VAPID details
const vapidDetails = {
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@inopnc.com',
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!
}

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
)

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: unknown
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  timestamp?: number
  urgency?: 'critical' | 'high' | 'medium' | 'low'
}

interface NotificationRequest {
  userIds?: string[]
  siteIds?: string[]
  roles?: string[]
  payload: PushNotificationPayload
  scheduleAt?: string
  notificationType: 'material_approval' | 'daily_report_reminder' | 'safety_alert' | 'equipment_maintenance' | 'site_announcement'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication and get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to send notifications (admin/manager roles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body: NotificationRequest = await request.json()
    const { userIds, siteIds, roles, payload, scheduleAt, notificationType } = body

    // Validate required fields
    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    // If scheduled, store in database for later processing
    if (scheduleAt) {
      const { data: scheduledNotification, error: scheduleError } = await supabase
        .from('scheduled_notifications')
        .insert({
          title: payload.title,
          body: payload.body,
          payload: payload,
          user_ids: userIds,
          site_ids: siteIds,
          roles: roles,
          notification_type: notificationType,
          scheduled_at: scheduleAt,
          created_by: user.id,
          organization_id: profile.organization_id
        })
        .select()

      if (scheduleError) {
        console.error('Error scheduling notification:', scheduleError)
        return NextResponse.json({ error: 'Failed to schedule notification' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification scheduled successfully',
        scheduledId: scheduledNotification[0]?.id 
      })
    }

    // Get target users and their push subscriptions
    let query = supabase
      .from('profiles')
      .select('id, push_subscription, notification_preferences, role, site_id')

    // Apply filters
    if (userIds?.length) {
      query = query.in('id', userIds)
    }
    if (siteIds?.length) {
      query = query.in('site_id', siteIds)
    }
    if (roles?.length) {
      query = query.in('role', roles)
    }

    // For non-system admins, limit to same organization
    if (profile.role !== 'system_admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data: targetUsers, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching target users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch target users' }, { status: 500 })
    }

    if (!targetUsers?.length) {
      return NextResponse.json({ error: 'No target users found' }, { status: 404 })
    }

    // Get notification counts for rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentNotifications } = await supabase
      .from('notification_logs')
      .select('user_id')
      .gte('sent_at', oneHourAgo)
      .in('user_id', targetUsers.map((u: unknown) => u.id))
    
    // Count notifications per user
    const notificationCounts: Record<string, number> = {}
    recentNotifications?.forEach((log: unknown) => {
      notificationCounts[log.user_id] = (notificationCounts[log.user_id] || 0) + 1
    })

    // Filter users based on their notification preferences
    const eligibleUsers = targetUsers.filter((user: unknown) => {
      if (!user.push_subscription) return false
      
      const prefs = user.notification_preferences || {}
      
      // Check if push notifications are enabled
      if (!prefs.push_enabled) return false
      
      // Check if this notification type is enabled globally
      const typeMap: Record<string, string> = {
        'material_approval': 'material_approvals',
        'daily_report_reminder': 'daily_report_reminders',
        'safety_alert': 'safety_alerts',
        'equipment_maintenance': 'equipment_maintenance',
        'site_announcement': 'site_announcements'
      }
      
      const prefKey = typeMap[notificationType]
      if (prefKey && prefs[prefKey] === false) return false
      
      // Check site-specific preferences
      if (user.site_id && prefs.site_preferences?.[user.site_id]) {
        const sitePrefs = prefs.site_preferences[user.site_id]
        if (!sitePrefs.enabled || (prefKey && sitePrefs[prefKey] === false)) {
          return false
        }
      }
      
      // Check notification rate limit
      const maxPerHour = prefs.max_notifications_per_hour || 10
      if ((notificationCounts[user.id] || 0) >= maxPerHour && payload.urgency !== 'critical') {
        console.log(`User ${user.id} has reached notification limit (${maxPerHour}/hour)`)
        return false
      }
      
      // Check daily report reminder frequency
      if (notificationType === 'daily_report_reminder') {
        const frequency = prefs.daily_report_reminder_frequency || 'daily'
        const now = new Date()
        const dayOfWeek = now.getDay()
        
        if (frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
          return false // Skip weekends
        }
        // Custom frequency would be handled by the scheduled_notifications table
      }
      
      // Check quiet hours for non-critical notifications
      if (payload.urgency !== 'critical' && prefs.quiet_hours_enabled) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinutes = now.getMinutes()
        const currentTime = currentHour * 60 + currentMinutes
        
        const [startHour, startMin] = (prefs.quiet_hours_start || '22:00').split(':').map((x: unknown) => Number(x))
        const [endHour, endMin] = (prefs.quiet_hours_end || '08:00').split(':').map((x: unknown) => Number(x))
        const startTime = startHour * 60 + startMin
        const endTime = endHour * 60 + endMin
        
        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (startTime > endTime) {
          if (currentTime >= startTime || currentTime <= endTime) {
            return false
          }
        } else {
          if (currentTime >= startTime && currentTime <= endTime) {
            return false
          }
        }
      }
      
      return true
    })

    // Send push notifications
    const notificationPromises = eligibleUsers.map(async (user: unknown) => {
      try {
        const subscription = JSON.parse(user.push_subscription)
        const prefs = user.notification_preferences || {}
        
        // Customize payload based on user preferences
        const customizedPayload = {
          ...payload,
          timestamp: Date.now(),
          data: {
            ...payload.data,
            notificationType,
            userId: user.id,
            url: getNotificationUrl(notificationType, payload.data)
          }
        }
        
        // Apply user preferences
        if (!prefs.sound_enabled) {
          customizedPayload.silent = true
        }
        if (!prefs.show_previews) {
          customizedPayload.body = '새로운 알림이 있습니다'
        }
        if (prefs.vibration_enabled === false) {
          delete customizedPayload.vibrate
        }

        const result = await webpush.sendNotification(
          subscription,
          JSON.stringify(customizedPayload),
          {
            urgency: payload.urgency || 'normal',
            TTL: payload.urgency === 'critical' ? 86400 : 3600 // 24h for critical, 1h for others
          }
        )

        // Log successful delivery
        await supabase
          .from('notification_logs')
          .insert({
            user_id: user.id,
            notification_type: notificationType,
            title: payload.title,
            body: payload.body,
            status: 'delivered',
            sent_at: new Date().toISOString(),
            sent_by: user.id
          })

        return { success: true, userId: user.id }
      } catch (error: unknown) {
        console.error(`Failed to send notification to user ${user.id}:`, error)
        
        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('profiles')
            .update({ push_subscription: null })
            .eq('id', user.id)
        }

        // Log failed delivery
        await supabase
          .from('notification_logs')
          .insert({
            user_id: user.id,
            notification_type: notificationType,
            title: payload.title,
            body: payload.body,
            status: 'failed',
            error_message: error.message,
            sent_at: new Date().toISOString(),
            sent_by: user.id
          })

        return { success: false, userId: user.id, error: error.message }
      }
    })

    const results = await Promise.allSettled(notificationPromises)
    const successCount = results.filter((r: unknown) => r.status === 'fulfilled' && r.value.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successCount} users${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      details: {
        total: eligibleUsers.length,
        successful: successCount,
        failed: failureCount,
        excluded: targetUsers.length - eligibleUsers.length
      }
    })

  } catch (error: unknown) {
    console.error('Push notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send push notification',
      details: error.message 
    }, { status: 500 })
  }
}

function getNotificationUrl(type: string, data?: unknown): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'
  
  switch (type) {
    case 'material_approval':
      return `${baseUrl}/dashboard/materials/requests${data?.requestId ? `/${data.requestId}` : ''}`
    case 'daily_report_reminder':
      return `${baseUrl}/dashboard/daily-reports/new`
    case 'safety_alert':
      return `${baseUrl}/dashboard/safety${data?.incidentId ? `/incidents/${data.incidentId}` : ''}`
    case 'equipment_maintenance':
      return `${baseUrl}/dashboard/equipment${data?.equipmentId ? `/${data.equipmentId}` : ''}`
    case 'site_announcement':
      return `${baseUrl}/dashboard/notifications${data?.announcementId ? `/${data.announcementId}` : ''}`
    default:
      return `${baseUrl}/dashboard`
  }
}