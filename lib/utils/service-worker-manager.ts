// Service Worker Manager for Offline Support
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private isSupported: boolean

  constructor() {
    this.isSupported = 'serviceWorker' in navigator
  }

  /**
   * Register the service worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('[SW Manager] Service Worker not supported')
      return false
    }

    try {
      // Only register in production or when explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_SW) {
        console.log('[SW Manager] Service Worker disabled in development')
        return false
      }

      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      })

      console.log('[SW Manager] Service Worker registered successfully')

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              this.notifyUpdate()
            }
          })
        }
      })

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW Manager] Service Worker controller changed')
      })

      return true
    } catch (error) {
      console.error('[SW Manager] Service Worker registration failed:', error)
      return false
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.isSupported || !this.registration) {
      return false
    }

    try {
      const success = await this.registration.unregister()
      if (success) {
        console.log('[SW Manager] Service Worker unregistered')
        this.registration = null
      }
      return success
    } catch (error) {
      console.error('[SW Manager] Failed to unregister Service Worker:', error)
      return false
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
      console.log('[SW Manager] Checked for updates')
    } catch (error) {
      console.error('[SW Manager] Update check failed:', error)
    }
  }

  /**
   * Cache a drawing for offline access
   */
  async cacheDrawing(drawing: {
    id: string
    title: string
    fileUrl: string
    [key: string]: any
  }): Promise<void> {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      console.warn('[SW Manager] Cannot cache drawing - no active service worker')
      return
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_DRAWING',
      drawing,
    })
  }

  /**
   * Get all cached offline drawings
   */
  async getOfflineDrawings(): Promise<any[]> {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      return []
    }

    return new Promise(resolve => {
      const channel = new MessageChannel()

      channel.port1.onmessage = event => {
        resolve(event.data.drawings || [])
      }

      navigator.serviceWorker.controller.postMessage({ type: 'GET_OFFLINE_DRAWINGS' }, [
        channel.port2,
      ])

      // Timeout fallback
      setTimeout(() => resolve([]), 5000)
    })
  }

  /**
   * Clear offline cache
   */
  async clearOfflineCache(): Promise<void> {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      return
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_OFFLINE_CACHE',
    })
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag: string = 'sync-drawings'): Promise<boolean> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('[SW Manager] Background sync not supported')
      return false
    }

    try {
      await (this.registration as any).sync.register(tag)
      console.log('[SW Manager] Background sync registered:', tag)
      return true
    } catch (error) {
      console.error('[SW Manager] Background sync registration failed:', error)
      return false
    }
  }

  /**
   * Check if app is running offline
   */
  isOffline(): boolean {
    return !navigator.onLine
  }

  /**
   * Add offline event listeners
   */
  addOfflineListeners(onOnline: () => void, onOffline: () => void): () => void {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }

  /**
   * Notify user about update
   */
  private notifyUpdate(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('앱 업데이트', {
        body: '새로운 버전이 설치되었습니다. 새로고침하여 적용하세요.',
        icon: '/icon-192x192.png',
        tag: 'app-update',
      })
    }
  }

  /**
   * Get registration status
   */
  getStatus(): {
    supported: boolean
    registered: boolean
    offline: boolean
  } {
    return {
      supported: this.isSupported,
      registered: !!this.registration,
      offline: this.isOffline(),
    }
  }
}

// Singleton instance
let swManagerInstance: ServiceWorkerManager | null = null

/**
 * Get or create ServiceWorkerManager instance
 */
export function getServiceWorkerManager(): ServiceWorkerManager {
  if (!swManagerInstance) {
    swManagerInstance = new ServiceWorkerManager()
  }
  return swManagerInstance
}
