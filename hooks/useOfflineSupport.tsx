'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { getServiceWorkerManager } from '@/lib/utils/service-worker-manager'

interface OfflineStatus {
  isOffline: boolean
  isServiceWorkerReady: boolean
  cachedDrawingsCount: number
}

interface UseOfflineSupportOptions {
  enableAutoSync?: boolean
  showNotifications?: boolean
  autoRegister?: boolean
}

export function useOfflineSupport(options: UseOfflineSupportOptions = {}) {
  const { enableAutoSync = true, showNotifications = true, autoRegister = true } = options

  const [status, setStatus] = useState<OfflineStatus>({
    isOffline: false,
    isServiceWorkerReady: false,
    cachedDrawingsCount: 0,
  })

  const swManager = useRef(getServiceWorkerManager())
  const syncTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize service worker
  useEffect(() => {
    if (!autoRegister) return

    const initServiceWorker = async () => {
      const registered = await swManager.current.register()

      if (registered) {
        setStatus(prev => ({ ...prev, isServiceWorkerReady: true }))

        // Get initial cached drawings count
        const drawings = await swManager.current.getOfflineDrawings()
        setStatus(prev => ({ ...prev, cachedDrawingsCount: drawings.length }))
      }
    }

    initServiceWorker()

    // Cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [autoRegister])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOffline: false }))

      if (showNotifications) {
        toast.success('인터넷 연결이 복구되었습니다')
      }

      // Auto-sync after coming online
      if (enableAutoSync) {
        syncTimeoutRef.current = setTimeout(() => {
          swManager.current.requestBackgroundSync()
        }, 2000)
      }
    }

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOffline: true }))

      if (showNotifications) {
        toast.error('오프라인 모드로 전환되었습니다', {
          duration: 5000,
          description: '일부 기능이 제한될 수 있습니다',
        })
      }
    }

    const cleanup = swManager.current.addOfflineListeners(handleOnline, handleOffline)

    // Check initial status
    setStatus(prev => ({ ...prev, isOffline: swManager.current.isOffline() }))

    return cleanup
  }, [enableAutoSync, showNotifications])

  // Cache a drawing for offline access
  const cacheDrawing = useCallback(
    async (drawing: { id: string; title: string; fileUrl: string; [key: string]: any }) => {
      try {
        await swManager.current.cacheDrawing(drawing)

        // Update cached count
        const drawings = await swManager.current.getOfflineDrawings()
        setStatus(prev => ({ ...prev, cachedDrawingsCount: drawings.length }))

        if (showNotifications) {
          toast.success(`"${drawing.title}" 오프라인 저장 완료`)
        }
      } catch (error) {
        console.error('Failed to cache drawing:', error)
        if (showNotifications) {
          toast.error('오프라인 저장 실패')
        }
      }
    },
    [showNotifications]
  )

  // Get all cached drawings
  const getCachedDrawings = useCallback(async () => {
    try {
      const drawings = await swManager.current.getOfflineDrawings()
      setStatus(prev => ({ ...prev, cachedDrawingsCount: drawings.length }))
      return drawings
    } catch (error) {
      console.error('Failed to get cached drawings:', error)
      return []
    }
  }, [])

  // Clear offline cache
  const clearCache = useCallback(async () => {
    try {
      await swManager.current.clearOfflineCache()
      setStatus(prev => ({ ...prev, cachedDrawingsCount: 0 }))

      if (showNotifications) {
        toast.success('오프라인 캐시가 삭제되었습니다')
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      if (showNotifications) {
        toast.error('캐시 삭제 실패')
      }
    }
  }, [showNotifications])

  // Force sync
  const forceSync = useCallback(async () => {
    if (status.isOffline) {
      if (showNotifications) {
        toast.error('오프라인 상태에서는 동기화할 수 없습니다')
      }
      return false
    }

    try {
      const success = await swManager.current.requestBackgroundSync()

      if (success && showNotifications) {
        toast.success('동기화가 시작되었습니다')
      }

      return success
    } catch (error) {
      console.error('Sync failed:', error)
      if (showNotifications) {
        toast.error('동기화 실패')
      }
      return false
    }
  }, [status.isOffline, showNotifications])

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      await swManager.current.checkForUpdates()
      if (showNotifications) {
        toast.info('업데이트 확인 중...')
      }
    } catch (error) {
      console.error('Update check failed:', error)
    }
  }, [showNotifications])

  return {
    ...status,
    cacheDrawing,
    getCachedDrawings,
    clearCache,
    forceSync,
    checkForUpdates,
  }
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOffline, cachedDrawingsCount } = useOfflineSupport({
    showNotifications: false,
  })

  if (!isOffline) return null

  return (
    <div className="offline-indicator">
      <div className="offline-badge">
        <span className="offline-dot"></span>
        <span className="offline-text">오프라인</span>
      </div>
      {cachedDrawingsCount > 0 && (
        <span className="cached-count">캐시: {cachedDrawingsCount}개</span>
      )}
    </div>
  )
}
