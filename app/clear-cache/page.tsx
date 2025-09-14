'use client'


export default function ClearCachePage() {
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState<string>('')

  const clearAllCaches = async () => {
    setIsClearing(true)
    setResult('')
    
    try {
      let messages: string[] = []

      // Service Worker 캐시 삭제
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        messages.push(`발견된 캐시: ${cacheNames.length}개`)
        
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        messages.push('✅ Service Worker 캐시 삭제 완료')
      }

      // Service Worker 등록 해제
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(registration => registration.unregister())
        )
        messages.push('✅ Service Worker 등록 해제 완료')
      }

      // Local Storage 삭제
      localStorage.clear()
      messages.push('✅ Local Storage 삭제 완료')

      // Session Storage 삭제
      sessionStorage.clear()
      messages.push('✅ Session Storage 삭제 완료')

      // IndexedDB 삭제
      const dbNames = ['supabase-cache', 'keyval-store', 'workbox-precache']
      for (const dbName of dbNames) {
        try {
          const deleteReq = indexedDB.deleteDatabase(dbName)
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => resolve(true)
            deleteReq.onerror = () => reject(deleteReq.error)
          })
          messages.push(`✅ IndexedDB '${dbName}' 삭제 완료`)
        } catch {
          messages.push(`⚠️ IndexedDB '${dbName}' 삭제 실패 (존재하지 않음)`)
        }
      }

      setResult(messages.join('\n'))
      
      // 3초 후 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 3000)
      
    } catch (error) {
      setResult(`❌ 오류 발생: ${error}`)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <Trash2 className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">PWA 캐시 삭제</h1>
          <p className="text-gray-600 text-sm">
            모든 PWA 캐시, Service Worker, Local Storage를 삭제합니다.
          </p>
        </div>

        <button
          onClick={clearAllCaches}
          disabled={isClearing}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl transition-colors"
        >
          {isClearing ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              삭제 중...
            </>
          ) : (
            <>
              <Trash2 className="h-5 w-5" />
              모든 캐시 삭제
            </>
          )}
        </button>

        {result && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">삭제 결과:</h3>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {result}
            </pre>
            {result.includes('✅') && (
              <p className="text-green-600 text-sm mt-2 font-medium">
                3초 후 페이지가 새로고침됩니다...
              </p>
            )}
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 다른 방법들:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• F12 → Application → Clear Storage</li>
            <li>• Ctrl+Shift+R (하드 새로고침)</li>
            <li>• 시크릿/프라이빗 모드 사용</li>
          </ul>
        </div>
      </div>
    </div>
  )
}