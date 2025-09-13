// Offline storage utilities for PWA functionality
// Handles storing and syncing data when offline

export interface OfflineAction {
  id: string
  type: 'daily-report' | 'attendance' | 'material-request' | 'general'
  url: string
  method: string
  headers: Record<string, string>
  body: string
  timestamp: string
  retryCount: number
}

export interface PendingData {
  id: string
  data: any
  timestamp: string
  type: string
}

class OfflineStorageManager {
  private readonly STORAGE_KEYS = {
    PENDING_DAILY_REPORTS: 'sw-pending-daily-reports',
    PENDING_ATTENDANCE: 'sw-pending-attendance', 
    PENDING_MATERIAL_REQUESTS: 'sw-pending-material-requests',
    PENDING_OFFLINE_ACTIONS: 'sw-pending-offline-actions',
    CACHED_DATA: 'sw-cached-data'
  }

  // Store data for offline submission
  async storePendingData(type: keyof typeof this.STORAGE_KEYS, data: any): Promise<string> {
    try {
      const storageKey = this.STORAGE_KEYS[type]
      const existing = this.getStoredData(storageKey)
      
      const pendingItem: PendingData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        data,
        timestamp: new Date().toISOString(),
        type
      }
      
      existing.push(pendingItem)
      localStorage.setItem(storageKey, JSON.stringify(existing))
      
      // Trigger background sync if available
      this.triggerBackgroundSync(type)
      
      return pendingItem.id
    } catch (error) {
      console.error('Failed to store pending data:', error)
      throw error
    }
  }

  // Get all pending data of a specific type
  getPendingData(type: keyof typeof this.STORAGE_KEYS): PendingData[] {
    try {
      const storageKey = this.STORAGE_KEYS[type]
      return this.getStoredData(storageKey)
    } catch (error) {
      console.error('Failed to get pending data:', error)
      return []
    }
  }

  // Remove pending data item
  removePendingData(type: keyof typeof this.STORAGE_KEYS, itemId: string): void {
    try {
      const storageKey = this.STORAGE_KEYS[type]
      const existing = this.getStoredData(storageKey)
      const filtered = existing.filter(item => item.id !== itemId)
      localStorage.setItem(storageKey, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to remove pending data:', error)
    }
  }

  // Clear all pending data of a specific type
  clearPendingData(type: keyof typeof this.STORAGE_KEYS): void {
    try {
      const storageKey = this.STORAGE_KEYS[type]
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to clear pending data:', error)
    }
  }

  // Store offline action for later execution
  async storeOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const existing = this.getStoredData(this.STORAGE_KEYS.PENDING_OFFLINE_ACTIONS)
      
      const offlineAction: OfflineAction = {
        ...action,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        retryCount: 0
      }
      
      existing.push(offlineAction)
      localStorage.setItem(this.STORAGE_KEYS.PENDING_OFFLINE_ACTIONS, JSON.stringify(existing))
      
      // Trigger background sync
      this.triggerBackgroundSync('PENDING_OFFLINE_ACTIONS')
      
      return offlineAction.id
    } catch (error) {
      console.error('Failed to store offline action:', error)
      throw error
    }
  }

  // Get all pending offline actions
  getPendingOfflineActions(): OfflineAction[] {
    try {
      return this.getStoredData(this.STORAGE_KEYS.PENDING_OFFLINE_ACTIONS)
    } catch (error) {
      console.error('Failed to get pending offline actions:', error)
      return []
    }
  }

  // Cache data for offline access
  cacheData(key: string, data: any, ttl?: number): void {
    try {
      const cached = this.getStoredData(this.STORAGE_KEYS.CACHED_DATA)
      const cacheItem = {
        key,
        data,
        timestamp: Date.now(),
        ttl: ttl || 24 * 60 * 60 * 1000 // Default 24 hours
      }
      
      // Remove existing entry if any
      const filtered = cached.filter((item: any) => item.key !== key)
      filtered.push(cacheItem)
      
      localStorage.setItem(this.STORAGE_KEYS.CACHED_DATA, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  // Get cached data
  getCachedData(key: string): any | null {
    try {
      const cached = this.getStoredData(this.STORAGE_KEYS.CACHED_DATA)
      const item = cached.find((item: any) => item.key === key)
      
      if (!item) return null
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.removeCachedData(key)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return null
    }
  }

  // Remove cached data
  removeCachedData(key: string): void {
    try {
      const cached = this.getStoredData(this.STORAGE_KEYS.CACHED_DATA)
      const filtered = cached.filter((item: any) => item.key !== key)
      localStorage.setItem(this.STORAGE_KEYS.CACHED_DATA, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to remove cached data:', error)
    }
  }

  // Check if we're currently offline
  isOffline(): boolean {
    return !navigator.onLine
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const used = new Blob(Object.values(localStorage)).size
      const available = 10 * 1024 * 1024 // Assume 10MB limit for localStorage
      
      return {
        used,
        available,
        percentage: Math.round((used / available) * 100)
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return { used: 0, available: 0, percentage: 0 }
    }
  }

  // Clean up expired cache data
  cleanupExpiredCache(): void {
    try {
      const cached = this.getStoredData(this.STORAGE_KEYS.CACHED_DATA)
      const now = Date.now()
      
      const valid = cached.filter((item: any) => {
        return now - item.timestamp <= item.ttl
      })
      
      localStorage.setItem(this.STORAGE_KEYS.CACHED_DATA, JSON.stringify(valid))
      
      const removedCount = cached.length - valid.length
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} expired cache items`)
      }
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error)
    }
  }

  // Private helper methods
  private getStoredData(key: string): unknown[] {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private async triggerBackgroundSync(type: keyof typeof this.STORAGE_KEYS): Promise<void> {
    try {
      if ('serviceWorker' in navigator && navigator.onLine) {
        const registration = await navigator.serviceWorker.ready
        
        if (registration.sync) {
          const syncTag = this.getSyncTag(type)
          await registration.sync.register(syncTag)
          console.log(`Background sync registered: ${syncTag}`)
        }
      }
    } catch (error) {
      console.error('Failed to trigger background sync:', error)
    }
  }

  private getSyncTag(type: keyof typeof this.STORAGE_KEYS): string {
    const syncTags = {
      PENDING_DAILY_REPORTS: 'daily-report-sync',
      PENDING_ATTENDANCE: 'attendance-sync',
      PENDING_MATERIAL_REQUESTS: 'material-request-sync',
      PENDING_OFFLINE_ACTIONS: 'offline-actions-sync',
      CACHED_DATA: 'cache-sync'
    }
    
    return syncTags[type] || 'general-sync'
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager()

// Utility functions for common operations

export async function submitDataOffline(
  url: string,
  method: string,
  data: any,
  type: 'daily-report' | 'attendance' | 'material-request' = 'general'
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (navigator.onLine) {
      // Try to submit immediately if online
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        return { success: true }
      }
    }
    
    // Store for offline submission
    const id = await offlineStorage.storeOfflineAction({
      url,
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      type
    })
    
    return { 
      success: true, 
      id,
      error: '오프라인 상태입니다. 연결 시 자동으로 동기화됩니다.'
    }
  } catch (error) {
    console.error('Failed to submit data offline:', error)
    return { 
      success: false, 
      error: '데이터 저장에 실패했습니다.' 
    }
  }
}

export function getPendingOfflineCount(): number {
  const dailyReports = offlineStorage.getPendingData('PENDING_DAILY_REPORTS').length
  const attendance = offlineStorage.getPendingData('PENDING_ATTENDANCE').length
  const materialRequests = offlineStorage.getPendingData('PENDING_MATERIAL_REQUESTS').length
  const actions = offlineStorage.getPendingOfflineActions().length
  
  return dailyReports + attendance + materialRequests + actions
}

export function clearAllOfflineData(): void {
  offlineStorage.clearPendingData('PENDING_DAILY_REPORTS')
  offlineStorage.clearPendingData('PENDING_ATTENDANCE')
  offlineStorage.clearPendingData('PENDING_MATERIAL_REQUESTS')
  offlineStorage.clearPendingData('PENDING_OFFLINE_ACTIONS')
}