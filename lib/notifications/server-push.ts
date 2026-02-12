import { sendSystemEmail } from '@/lib/notifications/system-email'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
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
  /**
   * Service worker expects a top-level url; keep for backward compatibility with existing sw.js.
   */
  url?: string
  /**
   * Service worker expects a top-level type (e.g. DAILY_REPORT_REMINDER).
   */
  type?: string
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

type ServiceRoleDispatchOptions = SendPushOptions & {
  /**
   * Extra metadata persisted in notification_logs.metadata (e.g. work_date, report_id).
   */
  logMetadata?: Record<string, unknown>
  /**
   * Optional de-duplication selector. If provided, recipients who already have a matching
   * notification_logs row are skipped.
   */
  dedupe?: {
    /**
     * JSONB key under metadata, queried via `metadata->>key = value`.
     */
    key: string
    value: string
  }
}

const NOTIFICATION_PREF_KEY_MAP: Record<string, string> = {
  material_approval: 'material_approvals',
  daily_report_reminder: 'daily_report_reminders',
  daily_report_submission: 'daily_report_updates',
  daily_report_approval: 'daily_report_updates',
  daily_report_rejection: 'daily_report_updates',
  safety_alert: 'safety_alerts',
  equipment_maintenance: 'equipment_maintenance',
  site_announcements: 'site_announcements',
}

const SW_TYPE_MAP: Record<string, string> = {
  daily_report_reminder: 'DAILY_REPORT_REMINDER',
  material_approval: 'MATERIAL_APPROVAL',
  safety_alert: 'SAFETY_ALERT',
  equipment_maintenance: 'EQUIPMENT_MAINTENANCE',
  site_announcement: 'SITE_ANNOUNCEMENT',
}

function resolveServiceWorkerType(notificationType: string, payloadType?: string) {
  if (payloadType && typeof payloadType === 'string') return payloadType
  const mapped = SW_TYPE_MAP[String(notificationType || '').trim()]
  return mapped || 'GENERAL'
}

function resolveTopLevelUrl(payload: PushPayload) {
  if (payload.url && typeof payload.url === 'string') return payload.url
  const maybe = payload.data?.url
  return typeof maybe === 'string' ? maybe : '/mobile'
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

/**
 * Service-role dispatcher for system workflows (cron, cross-user notifications).
 * - Reads profiles with service role
 * - Always writes notification_logs with service role
 * - Attempts web push if eligible; falls back to in-app log only
 *
 * NOTE: This is intentionally separate from sendPushToUsers() to avoid cookie/RLS limitations.
 */
export async function dispatchNotificationServiceRole({
  userIds,
  payload,
  notificationType,
  senderId = 'system',
  logMetadata,
  dedupe,
}: ServiceRoleDispatchOptions) {
  if (!userIds.length) return { success: false, message: 'No users provided' as const }

  const supabase = createServiceRoleClient()

  const prefKey = NOTIFICATION_PREF_KEY_MAP[notificationType]
  const swType = resolveServiceWorkerType(notificationType, payload.type)
  const url = resolveTopLevelUrl(payload)

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, push_subscription, notification_preferences, role, site_id')
    .in('id', userIds)

  if (error || !users) {
    console.error('[dispatchNotificationServiceRole] profiles fetch error:', error)
    return { success: false, error: 'Failed to fetch user profiles' as const }
  }

  let alreadySent = new Set<string>()
  if (dedupe?.key && dedupe?.value) {
    try {
      const { data: existing } = await supabase
        .from('notification_logs')
        .select('user_id')
        .eq('notification_type', notificationType)
        .eq(`metadata->>${dedupe.key}`, dedupe.value)
        .in(
          'user_id',
          users.map(u => u.id)
        )
      alreadySent = new Set((existing || []).map((r: any) => String(r.user_id)))
    } catch (e) {
      console.warn('[dispatchNotificationServiceRole] dedupe query failed (ignored):', e)
    }
  }

  const results = await Promise.allSettled(
    users.map(async (user: any) => {
      if (!user?.id) return { skipped: true, reason: 'missing_user_id' as const }
      if (alreadySent.has(String(user.id))) return { skipped: true, reason: 'deduped' as const }

      const prefs = user.notification_preferences || {}
      if (prefKey && prefs[prefKey] === false) {
        return { skipped: true, reason: 'pref_disabled' as const }
      }

      const finalPayload: PushPayload = {
        ...payload,
        type: swType,
        url,
        timestamp: Date.now(),
        data: {
          ...(payload.data || {}),
          notificationType,
          userId: user.id,
        },
      }

      const canAttemptPush =
        Boolean(user.push_subscription) &&
        prefs.push_enabled !== false &&
        vapidDetails.publicKey &&
        vapidDetails.privateKey
          ? true
          : false

      let pushSent = false
      let pushError: string | null = null

      if (canAttemptPush) {
        try {
          const sub =
            typeof user.push_subscription === 'string'
              ? JSON.parse(user.push_subscription)
              : user.push_subscription

          if (sub?.endpoint) {
            await webpush.sendNotification(sub, JSON.stringify(finalPayload), {
              urgency: (finalPayload.urgency as any) || 'normal',
            })
            pushSent = true
          }
        } catch (err: any) {
          pushError = err?.message || 'Unknown push error'
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from('profiles').update({ push_subscription: null }).eq('id', user.id)
          }
        }
      }

      const channel = pushSent ? 'push' : 'in_app'
      const metadata = {
        ...(logMetadata || {}),
        url,
        sw_type: swType,
        push_attempted: canAttemptPush,
        push_sent: pushSent,
        push_error: pushError,
      }

      await supabase.from('notification_logs').insert({
        user_id: user.id,
        notification_type: notificationType,
        title: finalPayload.title,
        body: finalPayload.body,
        status: 'delivered',
        sent_at: new Date().toISOString(),
        sent_by: senderId === 'system' ? null : senderId,
        target_role: user.role,
        target_site_id: user.site_id,
        channel,
        payload: finalPayload as any,
        metadata,
      })

      return { userId: user.id, pushSent }
    })
  )

  const fulfilled = results.filter(r => r.status === 'fulfilled') as Array<any>
  const pushCount = fulfilled.filter(r => r.value?.pushSent).length
  const skipped = fulfilled.filter(r => r.value?.skipped).length

  return {
    success: true,
    pushCount,
    skipped,
    processed: fulfilled.length,
    total: users.length,
  }
}
