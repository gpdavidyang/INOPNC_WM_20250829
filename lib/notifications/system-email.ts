'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { EmailNotificationPriority } from '@/types'

type SystemEmailParams = {
  email: string
  name?: string | null
  subject: string
  content: string
  priority?: EmailNotificationPriority
  metadata?: Record<string, unknown>
}

const simulateEmailSend = async (notification: { recipient_email: string; subject: string }) => {
  if (process.env.NODE_ENV === 'test') return
  await new Promise<void>((resolve, reject) => {
    setTimeout(
      () => {
        if (Math.random() > 0.02) {
          console.log(
            `📧 [SYSTEM EMAIL] to ${notification.recipient_email}: ${notification.subject}`
          )
          resolve()
        } else {
          reject(new Error('Simulated email send failure'))
        }
      },
      Math.random() * 500 + 250
    )
  })
}

export async function sendSystemEmail({
  email,
  name,
  subject,
  content,
  priority = 'normal',
  metadata,
}: SystemEmailParams) {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_notifications')
    .insert({
      recipient_email: email,
      recipient_name: name || email,
      subject,
      content,
      notification_type: 'system_notification',
      sender_id: null,
      priority,
      status: 'pending',
      scheduled_at: new Date().toISOString(),
      metadata: metadata || null,
      created_by: null,
    })
    .select()
    .single()

  if (error) {
    console.error('[SYSTEM EMAIL] Failed to queue email:', error)
    throw new Error('이메일 발송을 준비하지 못했습니다.')
  }

  try {
    await simulateEmailSend({
      recipient_email: data.recipient_email,
      subject: data.subject,
    })
  } catch (sendError) {
    console.error('[SYSTEM EMAIL] Simulated send failure:', sendError)
  }
}
