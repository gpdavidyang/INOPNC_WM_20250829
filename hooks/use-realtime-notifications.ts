'use client'

import type { NotificationExtended } from '@/types/notifications'

interface UseRealtimeNotificationsOptions {
  onNewNotification?: (notification: NotificationExtended) => void
  showToast?: boolean
}

export function useRealtimeNotifications({
  onNewNotification,
  showToast = true
}: UseRealtimeNotificationsOptions = {}) {
  const router = useRouter()
  const supabase = createClient()

  const handleNewNotification = useCallback((notification: NotificationExtended) => {
    // Call custom handler if provided
    if (onNewNotification) {
      onNewNotification(notification)
    }

    // Show toast notification if enabled
    if (showToast) {
      const toastOptions = {
        description: notification.message,
        duration: 5000,
        action: notification.action_url ? {
          label: '보기',
          onClick: () => {
            if (notification.action_url) {
              router.push(notification.action_url)
            }
          }
        } : undefined
      }

      switch (notification.type) {
        case 'success':
          toast.success(notification.title, toastOptions)
          break
        case 'error':
          toast.error(notification.title, toastOptions)
          break
        case 'warning':
          toast.warning(notification.title, toastOptions)
          break
        case 'system':
          toast.message(notification.title, toastOptions)
          break
        case 'approval':
          toast.info(notification.title, toastOptions)
          break
        default:
          toast(notification.title, toastOptions)
      }
    }

    // Refresh the page to update notification count
    router.refresh()
  }, [onNewNotification, showToast, router])

  useEffect(() => {
    // Get current user
    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('[REALTIME] No authenticated user, skipping subscription')
          return
        }

        console.log('[REALTIME] Setting up subscription for user:', user.id)

        // Subscribe to new notifications for the current user with enhanced error handling
        const channel = supabase
          .channel('notifications', {
            config: {
              // Add heartbeat and timeout settings for better connection reliability
              heartbeat_interval: 30000,  // 30 seconds
              reconnect_interval: 5000,   // 5 seconds
              timeout: 10000,            // 10 seconds
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('[REALTIME] Received notification:', payload)
              const notification = payload.new as NotificationExtended
              handleNewNotification(notification)
            }
          )
          .on('system', {}, (payload) => {
            // Handle system events for connection monitoring
            console.log('[REALTIME] System event:', payload)
          })
          .subscribe((status, err) => {
            console.log('[REALTIME] Subscription status:', status)
            if (err) {
              console.error('[REALTIME] Subscription error:', err)
              // Don't show error toast to user as WebSocket failures are common
              // and will be retried automatically
            }
          })

        // Cleanup subscription on unmount
        return () => {
          console.log('[REALTIME] Cleaning up subscription')
          channel.unsubscribe()
        }
      } catch (error) {
        console.error('[REALTIME] Error setting up realtime subscription:', error)
        // Silently fail - realtime is a nice-to-have feature, not critical
        return undefined
      }
    }

    const unsubscribePromise = setupSubscription()

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe()
        }
      }).catch(error => {
        console.error('Error cleaning up subscription:', error)
      })
    }
  }, [supabase, handleNewNotification])
}