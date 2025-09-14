'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'


export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-redirect when back online
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/dashboard')
    } else {
      // Try to reload the page
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {isOnline ? (
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-10 w-10 text-green-600 dark:text-green-400 animate-spin" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <WifiOff className="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isOnline ? '연결 복구 중...' : '오프라인 모드'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isOnline 
              ? '인터넷 연결이 복구되었습니다. 잠시만 기다려주세요.'
              : '인터넷 연결을 확인할 수 없습니다. 일부 기능은 오프라인에서도 사용 가능합니다.'
            }
          </p>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              오프라인에서 가능한 기능
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>저장된 작업일지 보기</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 text-green-500" />
                <span>출력현황 기록 (동기화 대기)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Home className="h-4 w-4 text-purple-500" />
                <span>현장정보 확인</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isOnline}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isOnline ? 'animate-spin' : ''}`} />
            {isOnline ? '연결 중...' : '다시 시도'}
          </button>

          {!isOnline && (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              오프라인으로 계속하기
            </button>
          )}
        </div>

        {/* Tips */}
        {!isOnline && (
          <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 오프라인에서 작성한 데이터는 인터넷 연결 시 자동으로 동기화됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}