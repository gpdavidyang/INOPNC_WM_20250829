import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

import webpush from 'web-push'

export const dynamic = 'force-dynamic'


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

// This endpoint should be called by a cron job or similar scheduler
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (check for a secret token)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Get scheduled notifications that are ready to be sent
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50)

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch scheduled notifications' }, { status: 500 })
    }

    if (!scheduledNotifications?.length) {
      return NextResponse.json({ 
        success: true, 
        message: 'No scheduled notifications to process',
        processed: 0 
      })
    }

    const results = await Promise.allSettled(
      scheduledNotifications.map(async (notification: unknown) => {
        try {
          // Mark as processing
          await supabase
            .from('scheduled_notifications')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', notification.id)

          // Get target users based on criteria
          let query = supabase
            .from('profiles')
            .select('id, push_subscription, notification_preferences, role, site_id, organization_id')
            .is('push_subscription', 'not.null')

          // Apply filters
          if (notification.user_ids?.length) {
            query = query.in('id', notification.user_ids)
          }
          if (notification.site_ids?.length) {
            query = query.in('site_id', notification.site_ids)
          }
          if (notification.roles?.length) {
            query = query.in('role', notification.roles)
          }
          
          // Limit to same organization if not system-wide
          if (notification.organization_id) {
            query = query.eq('organization_id', notification.organization_id)
          }

          const { data: targetUsers, error: usersError } = await query

          if (usersError) {
            throw new Error(`Failed to fetch target users: ${usersError.message}`)
          }

          if (!targetUsers?.length) {
            // Mark as completed but with no recipients
            await supabase
              .from('scheduled_notifications')
              .update({ 
                status: 'completed', 
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', notification.id)

            return { success: true, notificationId: notification.id, sent: 0, reason: 'No target users found' }
          }

          // Filter users based on notification preferences
          const eligibleUsers = targetUsers.filter((user: unknown) => {
            const prefs = user.notification_preferences || {}
            
            // Check if push notifications are enabled
            if (!prefs.push_enabled) return false
            
            // Check if this notification type is enabled
            const typeMap: Record<string, string> = {
              'material_approval': 'material_approvals',
              'daily_report_reminder': 'daily_report_reminders',
              'safety_alert': 'safety_alerts',
              'equipment_maintenance': 'equipment_maintenance',
              'site_announcement': 'site_announcements'
            }
            
            const prefKey = typeMap[notification.notification_type]
            if (prefKey && prefs[prefKey] === false) return false
            
            // Check quiet hours for non-critical notifications
            const payload = notification.payload || {}
            if (payload.urgency !== 'critical' && prefs.quiet_hours_enabled) {
              const now = new Date()
              const currentHour = now.getHours()
              const currentMinutes = now.getMinutes()
              const currentTime = currentHour * 60 + currentMinutes
              
              const [startHour, startMin] = (prefs.quiet_hours_start || '22:00').split(':').map((x: unknown) => Number(x))
              const [endHour, endMin] = (prefs.quiet_hours_end || '08:00').split(':').map((x: unknown) => Number(x))
              const startTime = startHour * 60 + startMin
              const endTime = endHour * 60 + endMin
              
              // Handle overnight quiet hours
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
          const sendPromises = eligibleUsers.map(async (user: unknown) => {
            try {
              const subscription = JSON.parse(user.push_subscription)
              const prefs = user.notification_preferences || {}
              
              // Customize payload based on user preferences
              const customizedPayload = {
                ...notification.payload,
                timestamp: Date.now(),
                data: {
                  ...notification.payload.data,
                  notificationType: notification.notification_type,
                  userId: user.id,
                  scheduledNotificationId: notification.id
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
                  urgency: notification.payload.urgency || 'normal',
                  TTL: notification.payload.urgency === 'critical' ? 86400 : 3600
                }
              )

              // Log successful delivery
              await supabase
                .from('notification_logs')
                .insert({
                  user_id: user.id,
                  notification_type: notification.notification_type,
                  title: notification.title,
                  body: notification.body,
                  status: 'delivered',
                  sent_at: new Date().toISOString(),
                  sent_by: notification.created_by
                })

              return { success: true, userId: user.id }
            } catch (error: unknown) {
              console.error(`Failed to send scheduled notification to user ${user.id}:`, error)
              
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
                  notification_type: notification.notification_type,
                  title: notification.title,
                  body: notification.body,
                  status: 'failed',
                  error_message: error.message,
                  sent_at: new Date().toISOString(),
                  sent_by: notification.created_by
                })

              return { success: false, userId: user.id, error: error.message }
            }
          })

          const sendResults = await Promise.allSettled(sendPromises)
          const successCount = sendResults.filter((r: unknown) => r.status === 'fulfilled' && r.value.success).length

          // Mark scheduled notification as completed
          await supabase
            .from('scheduled_notifications')
            .update({ 
              status: 'completed', 
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          return { 
            success: true, 
            notificationId: notification.id, 
            sent: successCount,
            failed: sendResults.length - successCount,
            total: eligibleUsers.length
          }

        } catch (error: unknown) {
          console.error(`Failed to process scheduled notification ${notification.id}:`, error)
          
          // Mark as failed
          await supabase
            .from('scheduled_notifications')
            .update({ 
              status: 'failed', 
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          return { 
            success: false, 
            notificationId: notification.id, 
            error: error.message 
          }
        }
      })
    )

    const processed = results.length
    const successful = results.filter((r: unknown) => r.status === 'fulfilled' && r.value.success).length
    const failed = processed - successful

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} scheduled notifications`,
      details: {
        processed,
        successful,
        failed,
        results: results.map((r: unknown) => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
      }
    })

  } catch (error: unknown) {
    console.error('Error processing scheduled notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to process scheduled notifications',
      details: error.message 
    }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'scheduled-notifications-processor',
    timestamp: new Date().toISOString()
  })
}
