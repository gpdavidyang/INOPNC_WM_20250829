'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { deepLinkHandler } from '@/lib/deep-linking'

export function useDeepLinking() {
  const router = useRouter()

  useEffect(() => {
    // Set the router in the deep link handler
    deepLinkHandler.setRouter(router as any)

    // Check for pending deep links
    deepLinkHandler.checkPendingDeepLink()

    // Listen for notification messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        deepLinkHandler.navigate({
          url: event.data.url,
          type: event.data.notificationType,
          id: event.data.notificationId,
          action: event.data.action,
          params: event.data.params
        })
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    // Listen for foreground notifications
    const handleForegroundNotification = (event: CustomEvent) => {
      deepLinkHandler.handleForegroundNotification(event.detail)
    }

    window.addEventListener('foregroundNotification', handleForegroundNotification as EventListener)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
      window.removeEventListener('foregroundNotification', handleForegroundNotification as EventListener)
    }
  }, [router])
}