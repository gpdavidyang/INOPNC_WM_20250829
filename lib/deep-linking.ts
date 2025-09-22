/**
 * Deep Linking Handler for PWA Notifications
 * Handles navigation from notification clicks to specific app sections
 */


export interface DeepLinkParams {
  url: string
  type?: string
  id?: string
  action?: string
  params?: Record<string, unknown>
}

export class DeepLinkHandler {
  private static instance: DeepLinkHandler
  private router: NextRouter | null = null

  private constructor() {}

  static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler()
    }
    return DeepLinkHandler.instance
  }

  setRouter(router: NextRouter) {
    this.router = router
  }

  /**
   * Handle deep link navigation
   */
  async navigate(params: DeepLinkParams): Promise<void> {
    if (!this.router) {
      console.warn('Router not initialized for deep linking')
      // Store for later navigation
      sessionStorage.setItem('pendingDeepLink', JSON.stringify(params))
      return
    }

    const { url, type, id, action, params: queryParams } = params

    // Track deep link navigation
    this.trackDeepLink(params)

    // Build the target URL
    let targetUrl = url || '/dashboard'

    // Handle special navigation cases based on type
    switch (type) {
      case 'material_approval':
        targetUrl = id ? `/dashboard/materials/requests/${id}` : '/dashboard/materials/requests'
        break
      
      case 'daily_report_reminder':
        targetUrl = action === 'create' ? '/dashboard/daily-reports/new' : '/dashboard/daily-reports'
        break
      
      case 'safety_alert':
        targetUrl = id ? `/dashboard/safety/alerts/${id}` : '/dashboard/safety'
        break
      
      case 'equipment_maintenance':
        if (action === 'schedule' && queryParams?.equipmentId) {
          targetUrl = `/dashboard/equipment/maintenance/schedule?equipment=${queryParams.equipmentId}`
        } else if (id) {
          targetUrl = `/dashboard/equipment/${id}/maintenance`
        } else {
          targetUrl = '/dashboard/equipment'
        }
        break
      
      case 'site_announcement':
        targetUrl = id ? `/dashboard/notifications/${id}` : '/dashboard/notifications'
        break
    }

    // Navigate to the target URL
    await this.router.push(targetUrl)
  }

  /**
   * Check for pending deep links on app initialization
   */
  async checkPendingDeepLink(): Promise<void> {
    const pendingLink = sessionStorage.getItem('pendingDeepLink')
    if (pendingLink) {
      try {
        const params = JSON.parse(pendingLink)
        sessionStorage.removeItem('pendingDeepLink')
        await this.navigate(params)
      } catch (error) {
        console.error('Failed to process pending deep link:', error)
      }
    }
  }

  /**
   * Parse URL for deep link parameters
   */
  parseUrl(url: string): DeepLinkParams {
    try {
      const urlObj = new URL(url, window.location.origin)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      
      // Extract type and ID from URL path
      let type: string | undefined
      let id: string | undefined
      
      if (pathParts.includes('materials') && pathParts.includes('requests')) {
        type = 'material_approval'
        const idIndex = pathParts.indexOf('requests') + 1
        id = pathParts[idIndex]
      } else if (pathParts.includes('daily-reports')) {
        type = 'daily_report_reminder'
      } else if (pathParts.includes('safety') && pathParts.includes('alerts')) {
        type = 'safety_alert'
        const idIndex = pathParts.indexOf('alerts') + 1
        id = pathParts[idIndex]
      } else if (pathParts.includes('equipment')) {
        type = 'equipment_maintenance'
        const equipmentIndex = pathParts.indexOf('equipment') + 1
        id = pathParts[equipmentIndex]
      } else if (pathParts.includes('notifications')) {
        type = 'site_announcement'
        const idIndex = pathParts.indexOf('notifications') + 1
        id = pathParts[idIndex]
      }
      
      // Extract query parameters
      const params: Record<string, unknown> = {}
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value
      })
      
      return {
        url: urlObj.pathname,
        type,
        id,
        params: Object.keys(params).length > 0 ? params : undefined
      }
    } catch (error) {
      console.error('Failed to parse deep link URL:', error)
      return { url: '/dashboard' }
    }
  }

  /**
   * Track deep link navigation for analytics
   */
  private trackDeepLink(params: DeepLinkParams): void {
    // Send analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'notification_deep_link', {
        notification_type: params.type,
        notification_id: params.id,
        action: params.action,
        target_url: params.url
      })
    }

    // Log to notification analytics
    this.logNotificationEngagement({
      type: 'deep_link_navigation',
      notificationType: params.type,
      notificationId: params.id,
      action: params.action,
      targetUrl: params.url,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log notification engagement metrics
   */
  private async logNotificationEngagement(data: unknown): Promise<void> {
    try {
      await fetch('/api/notifications/analytics/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to log notification engagement:', error)
    }
  }

  /**
   * Handle notification received in foreground
   */
  handleForegroundNotification(notification: unknown): void {
    // Show in-app notification UI
    const event = new CustomEvent('foregroundNotification', {
      detail: notification
    })
    window.dispatchEvent(event)

    // Track notification received
    this.logNotificationEngagement({
      type: 'notification_received_foreground',
      notificationType: notification.data?.type,
      notificationId: notification.data?.id,
      timestamp: new Date().toISOString()
    })
  }
}

// Global instance
export const deepLinkHandler = DeepLinkHandler.getInstance()

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}