'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi, CloudOff, Clock } from 'lucide-react'
import { getPendingOfflineCount } from '@/lib/pwa/offline-storage'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check initial status
    setIsOffline(!navigator.onLine)
    updatePendingCount()

    // Listen for online/offline events
    const handleOffline = () => {
      setIsOffline(true)
      updatePendingCount()
    }

    const handleOnline = () => {
      setIsOffline(false)
      // Update count after a short delay to allow sync
      setTimeout(updatePendingCount, 2000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
    }
  }, [])

  const updatePendingCount = () => {
    const count = getPendingOfflineCount()
    setPendingCount(count)
  }

  // Don't show indicator if online and no pending data
  if (!isOffline && pendingCount === 0) {
    return null
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
      <div 
        className={`rounded-lg shadow-lg p-3 border transition-all duration-300 cursor-pointer ${
          isOffline 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${isOffline ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {isOffline ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <CloudOff className="h-4 w-4" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                isOffline 
                  ? 'text-amber-800 dark:text-amber-200' 
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {isOffline ? '오프라인 모드' : '동기화 대기 중'}
              </span>
              
              {pendingCount > 0 && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  isOffline
                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                }`}>
                  {pendingCount}
                </span>
              )}
            </div>
            
            <p className={`text-xs mt-0.5 ${
              isOffline 
                ? 'text-amber-700 dark:text-amber-300' 
                : 'text-blue-700 dark:text-blue-300'
            }`}>
              {isOffline 
                ? '일부 기능이 제한됩니다' 
                : `${pendingCount}개 항목이 동기화를 기다리고 있습니다`
              }
            </p>
          </div>
          
          <div className={`flex-shrink-0 text-xs ${
            isOffline 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {showDetails ? '▼' : '▶'}
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                <span className={isOffline ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}>
                  {isOffline 
                    ? '연결 시 자동으로 동기화됩니다'
                    : '백그라운드에서 동기화 중입니다'
                  }
                </span>
              </div>
              
              {pendingCount > 0 && (
                <div className={`text-xs ${isOffline ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  • 작업일지, 출근기록, 자재요청 등이 대기 중입니다
                </div>
              )}
              
              <div className={`text-xs ${isOffline ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                • 오프라인에서도 대부분의 기능을 사용할 수 있습니다
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for offline status
export function useOfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine)
      setPendingCount(getPendingOfflineCount())
    }

    updateStatus()

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    const interval = setInterval(updateStatus, 30000)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  return { isOffline, pendingCount }
}