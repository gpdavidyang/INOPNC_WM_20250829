'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Download, AlertTriangle } from 'lucide-react'

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null
  isUpdateAvailable: boolean
  isInstalling: boolean
  error: string | null
}

export function ServiceWorkerRegistration() {
  const [state, setState] = useState<ServiceWorkerState>({
    registration: null,
    isUpdateAvailable: false,
    isInstalling: false,
    error: null
  })

  useEffect(() => {
    // Check if Service Worker is disabled via localStorage (for debugging)
    const swDisabled = localStorage.getItem('disable-service-worker') === 'true'
    
    if (swDisabled) {
      console.log('[ServiceWorker] Registration disabled by user preference')
      return
    }
    
    // Check if we're on auth pages - don't register SW on auth pages
    if (typeof window !== 'undefined' && 
        (window.location.pathname.includes('/auth/') || 
         window.location.pathname === '/clear-sw.html')) {
      console.log('[ServiceWorker] Skipping registration on auth/utility pages')
      return
    }
    
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      setState(prev => ({ ...prev, isInstalling: true, error: null }))
      
      // Check if sw.js is available first
      const swResponse = await fetch('/sw.js')
      if (!swResponse.ok) {
        console.warn('Service Worker file not available, skipping registration')
        setState(prev => ({ ...prev, isInstalling: false }))
        return
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('ServiceWorker registered:', registration)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              setState(prev => ({ 
                ...prev, 
                isUpdateAvailable: true,
                registration 
              }))
            }
          })
        }
      })

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker updated, reload to get latest version
        window.location.reload()
      })

      setState(prev => ({ 
        ...prev, 
        registration, 
        isInstalling: false 
      }))

      // Setup background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        setupBackgroundSync(registration)
      }

      // Setup push notifications
      setupPushNotifications(registration)

    } catch (error) {
      console.error('ServiceWorker registration failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Service Worker 등록에 실패했습니다.',
        isInstalling: false 
      }))
    }
  }

  const setupBackgroundSync = (registration: ServiceWorkerRegistration) => {
    // Register background sync for offline actions
    const syncTags = [
      'daily-report-sync',
      'attendance-sync', 
      'material-request-sync',
      'offline-actions-sync'
    ]

    // Listen for network status changes
    window.addEventListener('online', async () => {
      if (registration.sync) {
        try {
          // Trigger all pending syncs when back online
          for (const tag of syncTags) {
            await registration.sync.register(tag)
          }
          console.log('Background sync registered for offline data')
        } catch (error) {
          console.error('Background sync registration failed:', error)
        }
      }
    })
  }

  const setupPushNotifications = async (registration: ServiceWorkerRegistration) => {
    try {
      // Skip push notifications in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Push notifications skipped in development environment')
        return
      }
      
      // Check if push messaging is supported
      if ('PushManager' in window && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        const permission = await Notification.requestPermission()
        
        if (permission === 'granted') {
          console.log('Push notifications permission granted')
          
          // Get push subscription
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          })
          
          // Check if user has authentication cookies before making API call
          const hasAuthCookies = document.cookie.includes('supabase-auth-token') || 
                                 document.cookie.includes('sb-') ||
                                 document.cookie.includes('supabase.auth.token')
          
          if (!hasAuthCookies) {
            console.log('No authentication cookies found, skipping push subscription')
            return
          }
          
          // Check if user is authenticated
          const authResponse = await fetch('/api/auth/bridge-session', {
            method: 'POST',
            credentials: 'include'
          })
          
          if (!authResponse.ok) {
            console.log('User not authenticated, skipping push subscription')
            return
          }
          
          // Send subscription to server
          const subscribeResponse = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              subscription: subscription.toJSON(),
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform
              }
            })
          })
          
          if (subscribeResponse.ok) {
            console.log('Push subscription registered')
          } else {
            console.warn('Push subscription failed:', subscribeResponse.status)
          }
        }
      } else {
        console.log('Push notifications not supported or VAPID key missing')
      }
    } catch (error) {
      // Only log error in production, warn in development
      if (process.env.NODE_ENV === 'production') {
        console.error('Push notification setup failed:', error)
      } else {
        console.warn('Push notification setup failed (development):', error.message)
      }
    }
  }

  const handleUpdate = async () => {
    if (state.registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  const handleDismissUpdate = () => {
    setState(prev => ({ ...prev, isUpdateAvailable: false }))
  }

  // Update notification
  if (state.isUpdateAvailable) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-blue-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Download className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">
                업데이트 사용 가능
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                새로운 기능과 개선사항이 포함된 업데이트가 있습니다.
              </p>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-3 py-2 bg-white text-blue-600 text-xs font-medium rounded-md hover:bg-blue-50 transition-colors"
                >
                  업데이트
                </button>
                <button
                  onClick={handleDismissUpdate}
                  className="px-3 py-2 text-blue-100 hover:text-white text-xs"
                >
                  나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Installation status
  if (state.isInstalling) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              오프라인 기능 설정 중...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 dark:text-red-200">
                {state.error}
              </p>
              <button
                onClick={registerServiceWorker}
                className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Hook for offline status
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    setIsOffline(!navigator.onLine)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return isOffline
}

// Hook for background sync
export function useBackgroundSync() {
  const [pendingSync, setPendingSync] = useState(false)

  const addToSync = async (data: any, type: string) => {
    try {
      // Store data locally for sync when online
      const stored = localStorage.getItem(`sw-pending-${type}`) || '[]'
      const pending = JSON.parse(stored)
      
      const syncItem = {
        id: Date.now().toString(),
        data,
        timestamp: new Date().toISOString(),
        type
      }
      
      pending.push(syncItem)
      localStorage.setItem(`sw-pending-${type}`, JSON.stringify(pending))
      
      setPendingSync(true)
      
      // Register background sync if online
      if ('serviceWorker' in navigator && navigator.onLine) {
        const registration = await navigator.serviceWorker.ready
        if (registration.sync) {
          await registration.sync.register(`${type}-sync`)
        }
      }
      
      console.log(`Added to background sync: ${type}`)
    } catch (error) {
      console.error('Failed to add to background sync:', error)
    }
  }

  const clearPendingSync = (type: string) => {
    localStorage.removeItem(`sw-pending-${type}`)
    setPendingSync(false)
  }

  return { addToSync, clearPendingSync, pendingSync }
}