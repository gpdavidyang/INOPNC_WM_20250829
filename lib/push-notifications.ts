'use client'

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
  urgency?: 'critical' | 'high' | 'medium' | 'low'
}

interface SendNotificationOptions {
  userIds?: string[]
  siteIds?: string[]
  roles?: string[]
  payload: PushNotificationPayload
  scheduleAt?: string
  notificationType:
    | 'material_approval'
    | 'daily_report_reminder'
    | 'daily_report_submission'
    | 'daily_report_approval'
    | 'daily_report_rejection'
    | 'safety_alert'
    | 'equipment_maintenance'
    | 'site_announcement'
}

class PushNotificationService {
  private supported: boolean
  private publicVapidKey: string | null = null

  constructor() {
    this.supported =
      typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Initialize the push notification service
   */
  async initialize(): Promise<boolean> {
    if (!this.supported) {
      console.warn('Push notifications not supported')
      return false
    }

    // Check for authentication cookies before making API calls
    if (typeof document !== 'undefined') {
      const hasAuthCookies =
        document.cookie.includes('supabase-auth-token') ||
        document.cookie.includes('sb-') ||
        document.cookie.includes('supabase.auth.token') ||
        document.cookie.includes('auth-token')

      if (!hasAuthCookies) {
        console.log(
          '[PushNotification] No authentication cookies found, skipping VAPID initialization'
        )
        return false
      }
    }

    try {
      // Get VAPID public key from server
      const response = await fetch('/api/notifications/vapid', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error(`VAPID API responded with ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(
          `Expected JSON response but got: ${contentType}. Response: ${text.slice(0, 100)}...`
        )
      }

      const data = await response.json()

      if (!data.success || !data.publicKey) {
        throw new Error(`VAPID API error: ${data.error || 'Unknown error'}`)
      }

      const { publicKey } = data
      this.publicVapidKey = publicKey
      return true
    } catch (error) {
      console.error('Failed to initialize push notification service:', error)
      return false
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return this.supported
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.supported) return 'denied'
    return Notification.permission
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.supported) return 'denied'

    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      await this.subscribeToPush()
    }

    return permission
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.supported || !this.publicVapidKey) {
      console.error('Push notifications not supported or not initialized')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Update existing subscription
        await this.updateSubscription(subscription)
        return subscription
      }

      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey),
      })

      await this.updateSubscription(subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.supported) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscription()
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  /**
   * Send push notification to specified users
   */
  async sendNotification(options: SendNotificationOptions): Promise<Response> {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send notification')
    }

    return response
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    new Notification('INOPNC 테스트 알림', {
      body: '푸시 알림이 정상적으로 작동하고 있습니다!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-icon.png',
      tag: 'test-notification',
      data: {
        url: '/dashboard',
        timestamp: Date.now(),
      },
    })
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean
    subscription: PushSubscription | null
  }> {
    if (!this.supported) {
      return { isSubscribed: false, subscription: null }
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      return {
        isSubscribed: !!subscription,
        subscription,
      }
    } catch (error) {
      console.error('Failed to get subscription status:', error)
      return { isSubscribed: false, subscription: null }
    }
  }

  /**
   * Update subscription on server
   */
  private async updateSubscription(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update subscription')
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscription(): Promise<void> {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove subscription')
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Helper functions for common notification scenarios
export const notificationHelpers = {
  /**
   * Send material approval notification
   */
  async sendMaterialApproval(requestId: string, userIds: string[], materialName: string) {
    return pushNotificationService.sendNotification({
      userIds,
      notificationType: 'material_approval',
      payload: {
        title: '자재 요청 승인 필요',
        body: `${materialName} 자재 요청이 승인을 기다리고 있습니다`,
        icon: '/icons/material-approval-icon.png',
        badge: '/icons/badge-material.png',
        urgency: 'high',
        requireInteraction: true,
        actions: [
          { action: 'approve', title: '승인', icon: '/icons/approve-icon.png' },
          { action: 'reject', title: '거부', icon: '/icons/reject-icon.png' },
          { action: 'view', title: '상세보기' },
        ],
        data: {
          requestId,
          type: 'material_approval',
          url: `/dashboard/admin/materials?tab=requests${
            requestId ? `&search=${encodeURIComponent(requestId)}` : ''
          }`,
        },
      },
    })
  },

  /**
   * Send daily report reminder
   */
  async sendDailyReportReminder(siteIds: string[]) {
    return pushNotificationService.sendNotification({
      siteIds,
      notificationType: 'daily_report_reminder',
      payload: {
        title: '작업일지 작성 리마인더',
        body: '오늘의 작업일지를 작성해주세요',
        icon: '/icons/daily-report-icon.png',
        badge: '/icons/badge-report.png',
        urgency: 'medium',
        data: {
          type: 'daily_report_reminder',
          url: '/dashboard/daily-reports/new',
        },
      },
    })
  },

  /**
   * Send safety alert
   */
  async sendSafetyAlert(siteIds: string[], message: string, alertId: string) {
    return pushNotificationService.sendNotification({
      siteIds,
      notificationType: 'safety_alert',
      payload: {
        title: '⚠️ 안전 경고',
        body: message,
        icon: '/icons/safety-alert-icon.png',
        badge: '/icons/badge-safety.png',
        urgency: 'critical',
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        actions: [
          { action: 'acknowledge', title: '확인', icon: '/icons/acknowledge-icon.png' },
          { action: 'details', title: '상세정보' },
        ],
        data: {
          alertId,
          type: 'safety_alert',
          url: `/dashboard/safety/alerts/${alertId}`,
        },
      },
    })
  },

  /**
   * Send equipment maintenance reminder
   */
  async sendEquipmentMaintenance(
    userId: string,
    equipmentName: string,
    maintenanceType: 'routine' | 'urgent' | 'inspection',
    scheduledDate: string,
    maintenanceId: string
  ) {
    const isUrgent = maintenanceType === 'urgent'
    return pushNotificationService.sendNotification({
      userIds: [userId],
      notificationType: 'equipment_maintenance',
      payload: {
        title: isUrgent ? '🚨 긴급 장비 점검' : '🔧 장비 점검 일정',
        body: `${equipmentName} - ${new Date(scheduledDate).toLocaleDateString('ko-KR')} ${
          maintenanceType === 'routine'
            ? '정기 점검'
            : maintenanceType === 'urgent'
              ? '긴급 점검'
              : '특별 점검'
        }`,
        icon: '/icons/maintenance-icon.png',
        badge: '/icons/badge-maintenance.png',
        urgency: isUrgent ? 'high' : 'medium',
        requireInteraction: isUrgent,
        actions: [
          { action: 'schedule', title: '일정잡기' },
          { action: 'view', title: '상세보기' },
        ],
        data: {
          maintenanceId,
          equipmentName,
          maintenanceType,
          scheduledDate,
          type: 'equipment_maintenance',
          url: `/dashboard/equipment/maintenance/${maintenanceId}`,
        },
      },
    })
  },

  /**
   * Send site announcement
   */
  async sendSiteAnnouncement(
    userIds: string[],
    title: string,
    content: string,
    priority: 'low' | 'normal' | 'high' | 'critical' | 'urgent',
    announcementId: string
  ) {
    const isUrgent = priority === 'urgent' || priority === 'high' || priority === 'critical'
    return pushNotificationService.sendNotification({
      userIds,
      notificationType: 'site_announcement',
      payload: {
        title: `📢 ${title}`,
        body: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        icon: '/icons/announcement-icon.png',
        badge: '/icons/badge-announcement.png',
        urgency: isUrgent ? 'high' : 'low',
        requireInteraction: isUrgent,
        actions: [
          { action: 'read', title: '읽기' },
          { action: 'dismiss', title: '무시' },
        ],
        data: {
          announcementId,
          priority,
          type: 'site_announcement',
          url: `/dashboard/announcements/${announcementId}`,
        },
      },
    })
  },

  /**
   * Send daily report reminder to specific users (Batch)
   */
  async sendDailyReportReminderBatch(userIds: string[]) {
    return pushNotificationService.sendNotification({
      userIds,
      notificationType: 'daily_report_reminder',
      payload: {
        title: '작업일지 작성 리마인더',
        body: '오늘의 작업일지를 작성해주세요',
        icon: '/icons/daily-report-icon.png',
        badge: '/icons/badge-report.png',
        urgency: 'medium',
        data: {
          type: 'daily_report_reminder',
          url: '/dashboard/daily-reports/new',
        },
      },
    })
  },
}

export default pushNotificationService
