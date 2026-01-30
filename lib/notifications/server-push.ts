import { sendSystemEmail } from '@/lib/notifications/system-email'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configure VAPID details (Environment variables should be set)
const vapidDetails = {
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@inopnc.com',
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
}

// Only set if keys are present (to avoid errors during build time or missing envs)
if (vapidDetails.publicKey && vapidDetails.privateKey) {
  webpush.setVapidDetails(vapidDetails.subject, vapidDetails.publicKey, vapidDetails.privateKey)
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: any[]
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  urgency?: 'critical' | 'high' | 'medium' | 'low'
  timestamp?: number
}

interface SendPushOptions {
  userIds: string[]
  payload: PushPayload
  notificationType: string
  senderId?: string // User ID who triggered this, or 'system'
  skipPrefs?: boolean // Force send? (Usually false)
}

export async function sendPushToUsers({
  userIds,
  payload,
  notificationType,
  senderId = 'system',
}: SendPushOptions) {
  if (!userIds.length) return { success: false, message: 'No users provided' }

  const supabase = createClient()

  // 1. Fetch Users Profile with Subscription & Prefs & Email
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, push_subscription, notification_preferences, role, site_id')
    .in('id', userIds)

  if (error || !users) {
    console.error('Error fetching users for push:', error)
    return { success: false, error: 'Failed to fetch user profiles' }
  }

  const pushTargets: any[] = []
  const emailTargets: any[] = []

  // 2. Filter Users & Segment into Push vs Email
  for (const user of users) {
    const prefs = user.notification_preferences || {}

    // Check if category is enabled (e.g. daily_report_reminders)
    // If pref is explicitly false, user wants NO notification (neither push nor email)
    const typeMap: Record<string, string> = {
      material_approval: 'material_approvals',
      daily_report_reminder: 'daily_report_reminders',
      daily_report_submission: 'daily_report_updates',
      daily_report_approval: 'daily_report_updates',
      daily_report_rejection: 'daily_report_updates',
      safety_alert: 'safety_alerts',
      equipment_maintenance: 'equipment_maintenance',
      site_announcements: 'site_announcements',
    }
    const prefKey = typeMap[notificationType]
    if (prefKey && prefs[prefKey] === false) {
      continue // User opted out of this category completely
    }

    // Determine Logic:
    // Priority 1: Web Push (if subscribed AND push_enabled)
    // Priority 2: Email (if NOT pushed AND email_enabled)

    let isPushEligible = false

    if (user.push_subscription && prefs.push_enabled !== false) {
      // Default to true if undefined
      try {
        const sub =
          typeof user.push_subscription === 'string'
            ? JSON.parse(user.push_subscription)
            : user.push_subscription

        if (sub && sub.endpoint) {
          isPushEligible = true
          pushTargets.push({ user, sub })
        }
      } catch (e) {
        // Invalid subscription json
      }
    }

    if (!isPushEligible) {
      // Fallback to Email if enabled
      // Default to FALSE for email if undefined, unlike Push which defaults to true?
      // Or per requirements "secondary channel for those who are not subscribed"
      // Let's assume explicit enable needed or default if important?
      // Based on UI step 319, I set email_enabled default false.
      // But for important alerts, maybe force?
      // Let's stick to strict preference: if email_enabled is TRUE.
      if (prefs.email_enabled === true && user.email) {
        emailTargets.push(user)
      }
    }
  }

  // 3. Send Push
  const pushResults = await Promise.allSettled(
    pushTargets.map(async ({ user, sub }) => {
      try {
        const finalPayload = {
          ...payload,
          timestamp: Date.now(),
          data: {
            ...payload.data,
            notificationType,
            userId: user.id,
          },
        }

        await webpush.sendNotification(sub, JSON.stringify(finalPayload), {
          urgency: payload.urgency || 'normal',
        })

        // Log Success
        await supabase.from('notification_logs').insert({
          user_id: user.id,
          notification_type: notificationType,
          title: payload.title,
          body: payload.body,
          status: 'delivered',
          sent_at: new Date().toISOString(),
          sent_by: senderId,
          target_role: user.role,
          target_site_id: user.site_id,
          channel: 'push',
        })

        return user.id
      } catch (err: any) {
        // If 410/404, might want to try email fallback IMMEDIATELY?
        // For now complex, just log failure.

        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('profiles').update({ push_subscription: null }).eq('id', user.id)
        }

        await supabase.from('notification_logs').insert({
          user_id: user.id,
          notification_type: notificationType,
          title: payload.title,
          body: payload.body,
          status: 'failed',
          error_message: err.message || 'Unknown error',
          sent_at: new Date().toISOString(),
          sent_by: senderId,
          channel: 'push',
        })
        throw err
      }
    })
  )

  const pushSuccessCount = pushResults.filter(r => r.status === 'fulfilled').length

  // 4. Send Email Fallback
  // (Simulated via system-email.ts)
  const emailResults = await Promise.allSettled(
    emailTargets.map(async user => {
      try {
        await sendSystemEmail({
          email: user.email,
          name: user.full_name,
          subject: `[알림] ${payload.title}`,
          content: `${payload.body}\n\n바로가기: ${process.env.NEXT_PUBLIC_APP_URL || 'https://inopnc-wm.vercel.app'}${payload.data?.url || '/dashboard'}`,
          priority: 'normal',
          metadata: {
            notificationType,
            senderId,
            originalPayload: payload,
          },
        })

        // Log Email Success
        await supabase.from('notification_logs').insert({
          user_id: user.id,
          notification_type: notificationType,
          title: payload.title,
          body: payload.body,
          status: 'delivered',
          sent_at: new Date().toISOString(),
          sent_by: senderId,
          target_role: user.role,
          target_site_id: user.site_id,
          channel: 'email',
        })
        return user.id
      } catch (err: any) {
        await supabase.from('notification_logs').insert({
          user_id: user.id,
          notification_type: notificationType,
          title: payload.title,
          body: payload.body,
          status: 'failed',
          error_message: err.message || 'Email Error',
          sent_at: new Date().toISOString(),
          sent_by: senderId,
          channel: 'email',
        })
        throw err
      }
    })
  )

  const emailSuccessCount = emailResults.filter(r => r.status === 'fulfilled').length

  return {
    success: true,
    pushCount: pushSuccessCount,
    emailCount: emailSuccessCount,
    totalSent: pushSuccessCount + emailSuccessCount,
  }
}
