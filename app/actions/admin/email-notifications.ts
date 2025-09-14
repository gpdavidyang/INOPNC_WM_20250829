'use server'

import { withAdminAuth, AdminActionResult, AdminErrors } from './common'
import type { UserRole } from '@/types'

export interface EmailNotificationData {
  recipient_email: string
  recipient_name: string
  subject: string
  content: string
  notification_type:
    | 'welcome'
    | 'password_reset'
    | 'account_update'
    | 'document_reminder'
    | 'system_notification'
  sender_id: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_at?: string | null
  metadata?: unknown
}

export interface BulkEmailData {
  recipients: Array<{
    email: string
    name: string
    role?: UserRole
  }>
  subject: string
  content: string
  notification_type: EmailNotificationData['notification_type']
  priority: EmailNotificationData['priority']
  role_filter?: UserRole[]
  site_filter?: string[]
}

/**
 * Send individual email notification
 */
export async function sendEmailNotification(
  data: EmailNotificationData
): Promise<AdminActionResult<{ id: string; scheduled: boolean }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // Create email notification record
      const { data: notification, error } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: data.recipient_email,
          recipient_name: data.recipient_name,
          subject: data.subject,
          content: data.content,
          notification_type: data.notification_type,
          sender_id: data.sender_id,
          priority: data.priority,
          scheduled_at: data.scheduled_at || new Date().toISOString(),
          metadata: data.metadata || {},
          status: data.scheduled_at ? 'scheduled' : 'pending',
          created_by: profile.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating email notification:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // In a real implementation, integrate with email service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate the email sending
      const isScheduled = !!data.scheduled_at && new Date(data.scheduled_at) > new Date()

      if (!isScheduled) {
        // Simulate immediate sending
        await simulateEmailSend(notification)
      }

      return {
        success: true,
        data: {
          id: notification.id,
          scheduled: isScheduled,
        },
        message: isScheduled
          ? `이메일이 ${new Date(data.scheduled_at!).toLocaleString('ko-KR')}에 발송 예약되었습니다.`
          : '이메일이 성공적으로 발송되었습니다.',
      }
    } catch (error) {
      console.error('Email notification error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Send bulk email notifications
 */
export async function sendBulkEmailNotifications(
  data: BulkEmailData
): Promise<AdminActionResult<{ sent: number; failed: number; scheduled: boolean }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      let recipients = data.recipients

      // Filter recipients by role if specified
      if (data.role_filter && data.role_filter.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('email, full_name, role')
          .in('role', data.role_filter)
          .eq('status', 'active')

        if (users) {
          recipients = users.map((user: any) => ({
            email: user.email,
            name: user.full_name,
            role: user.role,
          }))
        }
      }

      // Filter by site if specified
      if (data.site_filter && data.site_filter.length > 0) {
        const { data: siteUsers } = await supabase
          .from('site_assignments')
          .select(
            `
            profiles!inner(email, full_name, role)
          `
          )
          .in('site_id', data.site_filter)
          .eq('is_active', true)

        if (siteUsers) {
          recipients = siteUsers.map((assignment: any) => ({
            email: assignment.profiles.email,
            name: assignment.profiles.full_name,
            role: assignment.profiles.role,
          }))
        }
      }

      if (recipients.length === 0) {
        return {
          success: false,
          error: '발송할 수신자가 없습니다.',
        }
      }

      // Create bulk email notifications
      const notifications = recipients.map((recipient: any) => ({
        recipient_email: recipient.email,
        recipient_name: recipient.name,
        subject: data.subject,
        content: data.content,
        notification_type: data.notification_type,
        sender_id: profile.id,
        priority: data.priority,
        scheduled_at: new Date().toISOString(),
        metadata: {
          bulk_id: `bulk_${Date.now()}`,
          recipient_role: recipient.role,
        },
        status: 'pending' as const,
        created_by: profile.id,
      }))

      const { data: insertedNotifications, error } = await supabase
        .from('email_notifications')
        .insert(notifications)
        .select()

      if (error) {
        console.error('Error creating bulk email notifications:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Simulate sending emails
      let sent = 0
      let failed = 0

      for (const notification of insertedNotifications || []) {
        try {
          await simulateEmailSend(notification)
          sent++
        } catch (error) {
          console.error('Failed to send email:', error)
          failed++

          // Update notification status to failed
          await supabase
            .from('email_notifications')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)
        }
      }

      return {
        success: true,
        data: {
          sent,
          failed,
          scheduled: false,
        },
        message: `총 ${recipients.length}명에게 이메일 발송 완료 (성공: ${sent}, 실패: ${failed})`,
      }
    } catch (error) {
      console.error('Bulk email notification error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get email notification templates
 */
export async function getEmailTemplates(): Promise<
  AdminActionResult<
    Array<{
      id: string
      name: string
      subject: string
      content: string
      type: string
    }>
  >
> {
  return withAdminAuth(async supabase => {
    try {
      // Predefined templates - in a real app, these would be stored in database
      const templates = [
        {
          id: 'welcome',
          name: '신규 사용자 환영',
          subject: '{{site_name}} 시스템에 오신 것을 환영합니다',
          content: `안녕하세요 {{user_name}}님,

{{site_name}} 건설 관리 시스템에 가입해주셔서 감사합니다.

계정 정보:
- 이메일: {{user_email}}
- 역할: {{user_role}}
- 임시 비밀번호: {{temp_password}}

로그인 후 반드시 비밀번호를 변경해주시기 바랍니다.

문의사항이 있으시면 언제든 연락해주세요.

감사합니다.`,
          type: 'welcome',
        },
        {
          id: 'password_reset',
          name: '비밀번호 재설정',
          subject: '비밀번호가 재설정되었습니다',
          content: `안녕하세요 {{user_name}}님,

관리자에 의해 비밀번호가 재설정되었습니다.

새 임시 비밀번호: {{temp_password}}

보안을 위해 로그인 후 즉시 비밀번호를 변경해주시기 바랍니다.

감사합니다.`,
          type: 'password_reset',
        },
        {
          id: 'account_update',
          name: '계정 정보 변경',
          subject: '계정 정보가 변경되었습니다',
          content: `안녕하세요 {{user_name}}님,

계정 정보가 다음과 같이 변경되었습니다:

{{changes}}

문의사항이 있으시면 관리자에게 연락해주세요.

감사합니다.`,
          type: 'account_update',
        },
        {
          id: 'document_reminder',
          name: '필수 서류 제출 알림',
          subject: '필수 서류 제출이 필요합니다',
          content: `안녕하세요 {{user_name}}님,

다음 필수 서류의 제출이 필요합니다:

{{required_documents}}

기한 내 제출하지 않을 경우 서비스 이용에 제한이 있을 수 있습니다.

빠른 시일 내에 제출해주시기 바랍니다.

감사합니다.`,
          type: 'document_reminder',
        },
        {
          id: 'system_notification',
          name: '시스템 공지사항',
          subject: '[공지] {{announcement_title}}',
          content: `안녕하세요,

{{announcement_content}}

자세한 내용은 시스템에 로그인하여 확인하시기 바랍니다.

감사합니다.`,
          type: 'system_notification',
        },
      ]

      return {
        success: true,
        data: templates,
      }
    } catch (error) {
      console.error('Error fetching email templates:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get email notification history
 */
export async function getEmailNotificationHistory(
  page = 1,
  limit = 10,
  status?: 'pending' | 'sent' | 'failed' | 'scheduled'
): Promise<
  AdminActionResult<{
    notifications: Array<{
      id: string
      recipient_email: string
      recipient_name: string
      subject: string
      notification_type: string
      status: string
      priority: string
      created_at: string
      sent_at?: string | null
      error_message?: string | null
    }>
    total: number
    pages: number
  }>
> {
  return withAdminAuth(async supabase => {
    try {
      let query = supabase
        .from('email_notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: notifications, error, count } = await query

      if (error) {
        console.error('Error fetching email notification history:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          notifications: notifications || [],
          total: count || 0,
          pages: totalPages,
        },
      }
    } catch (error) {
      console.error('Email notification history error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Simulate email sending (for development)
 * In production, replace with actual email service integration
 */
async function simulateEmailSend(notification: any): Promise<void> {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(
      () => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          console.log(
            `📧 [SIMULATED] Email sent to ${notification.recipient_email}: ${notification.subject}`
          )
          resolve()
        } else {
          reject(new Error('Simulated email service failure'))
        }
      },
      Math.random() * 1000 + 500
    ) // 500-1500ms delay
  })
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  tempPassword: string,
  userRole: UserRole
): Promise<AdminActionResult<{ id: string; scheduled: boolean }>> {
  return withAdminAuth(async (supabase, profile) => {
    const roleText =
      {
        worker: '작업자',
        site_manager: '현장관리자',
        customer_manager: '파트너사 관리자',
        admin: '관리자',
        system_admin: '시스템관리자',
      }[userRole] || '사용자'

    const emailData: EmailNotificationData = {
      recipient_email: userEmail,
      recipient_name: userName,
      subject: 'INOPNC 건설관리시스템에 오신 것을 환영합니다',
      content: `안녕하세요 ${userName}님,

INOPNC 건설관리시스템에 가입해주셔서 감사합니다.

계정 정보:
- 이메일: ${userEmail}
- 역할: ${roleText}
- 임시 비밀번호: ${tempPassword}

로그인 후 반드시 비밀번호를 변경해주시기 바랍니다.

시스템 접속: https://wm.inopnc.com
문의사항: admin@inopnc.com

감사합니다.
INOPNC 관리팀`,
      notification_type: 'welcome',
      sender_id: profile.id,
      priority: 'normal',
    }

    const result = await sendEmailNotification(emailData)
    if (result.success) {
      return {
        success: true,
        message: '환영 이메일이 성공적으로 발송되었습니다.',
      }
    } else {
      return result
    }
  })
}

/**
 * Send password reset notification
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  tempPassword: string
): Promise<AdminActionResult<{ id: string; scheduled: boolean }>> {
  return withAdminAuth(async (supabase, profile) => {
    const emailData: EmailNotificationData = {
      recipient_email: userEmail,
      recipient_name: userName,
      subject: '비밀번호가 재설정되었습니다',
      content: `안녕하세요 ${userName}님,

관리자에 의해 비밀번호가 재설정되었습니다.

새 임시 비밀번호: ${tempPassword}

보안을 위해 로그인 후 즉시 비밀번호를 변경해주시기 바랍니다.

시스템 접속: https://wm.inopnc.com

감사합니다.
INOPNC 관리팀`,
      notification_type: 'password_reset',
      sender_id: profile.id,
      priority: 'high',
    }

    return await sendEmailNotification(emailData)
  })
}
