'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserSiteWithAuth } from '@/app/actions/site-info-client'
import { forceSiteRefresh } from '@/app/actions/force-site-refresh'

export default function SiteDebugHelper() {
  const [debug, setDebug] = useState<any>({})
  const [isVisible, setIsVisible] = useState(false)

  const runDebugCheck = async () => {
    const supabase = createClient()
    const startTime = Date.now()
    
    try {
      // 1. 세션 체크
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const sessionResult = {
        hasSession: !!session,
        user: session?.user?.email,
        error: sessionError?.message
      }

      // 2. 유저 체크
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const userResult = {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        error: userError?.message
      }

      // 3. 사이트 정보 가져오기
      const siteResult = await getCurrentUserSiteWithAuth()
      
      // 4. 프로필 정보 가져오기
      let profileResult = null
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, email')
          .eq('id', user.id)
          .single()
        
        profileResult = {
          data: profile,
          error: profileError?.message
        }
      }

      const endTime = Date.now()
      
      setDebug({
        timestamp: new Date().toISOString(),
        duration: `${endTime - startTime}ms`,
        session: sessionResult,
        user: userResult,
        profile: profileResult,
        site: {
          success: siteResult.success,
          hasSiteData: !!siteResult.data,
          siteName: siteResult.data?.site_name,
          error: siteResult.error,
          data: siteResult.data
        }
      })
    } catch (error) {
      setDebug({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const forceRefresh = async () => {
    // 강제 새로고침을 통한 문제 해결
    localStorage.removeItem('inopnc-current-site')
    localStorage.removeItem('supabase.auth.token')
    
    // 세션 강제 새로고침
    const supabase = createClient()
    await supabase.auth.refreshSession()
    
    // 잠시 후 페이지 새로고침
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const quickLogin = async () => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'manager@inopnc.com',
        password: 'password123'
      })
      
      if (error) {
        alert('로그인 실패: ' + error.message)
        return
      }
      
      alert('로그인 성공! 잠시 후 페이지를 새로고침합니다.')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      alert('로그인 중 오류 발생: ' + error)
    }
  }

  const forceSiteRefreshAction = async () => {
    try {
      const result = await forceSiteRefresh()
      
      if (result.success) {
        if (result.data) {
          alert(`현장 정보 강제 로드 성공!\n현장: ${result.data.site_name}\n역할: ${result.data.user_role}${result.autoAssigned ? '\n(자동 할당됨)' : ''}`)
        } else {
          alert(result.message || '현장 할당이 없습니다. 관리자에게 문의하세요.')
        }
        
        // 디버그 정보 업데이트
        await runDebugCheck()
      } else {
        alert('현장 정보 로드 실패: ' + result.error)
      }
    } catch (error) {
      alert('현장 정보 로드 중 오류 발생: ' + error)
    }
  }

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* 플로팅 디버그 버튼 */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          title="현장 정보 디버그"
        >
          🔍
        </button>
      </div>

      {/* 디버그 패널 */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  현장 정보 디버그
                </h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={runDebugCheck}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🔍 현재 상태 확인
                </button>
                <button
                  onClick={quickLogin}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🚀 manager 빠른 로그인
                </button>
                <button
                  onClick={forceSiteRefreshAction}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ⚡ 현장정보 강제로드
                </button>
                <button
                  onClick={forceRefresh}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  🔄 강제 새로고침
                </button>
              </div>

              {debug.timestamp && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm font-mono space-y-2">
                    <div><strong>시간:</strong> {debug.timestamp}</div>
                    <div><strong>소요시간:</strong> {debug.duration}</div>
                    
                    {debug.error ? (
                      <div className="text-red-600 dark:text-red-400">
                        <strong>오류:</strong> {debug.error}
                      </div>
                    ) : (
                      <>
                        <div><strong>세션:</strong> {JSON.stringify(debug.session, null, 2)}</div>
                        <div><strong>유저:</strong> {JSON.stringify(debug.user, null, 2)}</div>
                        {debug.profile && (
                          <div><strong>프로필:</strong> {JSON.stringify(debug.profile, null, 2)}</div>
                        )}
                        <div><strong>사이트:</strong> {JSON.stringify(debug.site, null, 2)}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <h4 className="font-semibold mb-2">해결 방법:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>현재 상태 확인</strong>: 인증 및 데이터 상태를 확인합니다</li>
                  <li><strong>빠른 로그인</strong>: manager@inopnc.com으로 로그인을 시도합니다</li>
                  <li><strong>현장정보 강제로드</strong>: 서버에서 직접 현장 정보를 다시 불러옵니다</li>
                  <li><strong>강제 새로고침</strong>: 캐시를 지우고 페이지를 새로고침합니다</li>
                </ol>
                
                <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 가장 효과적인 순서:</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    1. 현재 상태 확인 → 2. 현장정보 강제로드 → 3. 필요시 빠른 로그인 → 4. 그래도 안되면 강제 새로고침
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}