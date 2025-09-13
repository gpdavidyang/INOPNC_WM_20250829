import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardWithNotifications from '@/components/dashboard/dashboard-with-notifications'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'

// 배포 환경에서 동적 렌더링 강제 - 현장 정보 로딩 문제 해결
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  try {
    console.log('🚀 [DASHBOARD] Starting dashboard page render')
    
    const supabase = createClient()
    
    // Get authenticated user using our session utility
    console.log('🔍 [DASHBOARD] Getting authenticated user...')
    const user = await getAuthenticatedUser()
    
    // This should not happen if middleware is working correctly
    if (!user) {
      console.error('❌ [DASHBOARD] No user in dashboard page - middleware should have caught this')
      redirect('/auth/login')
    }

    console.log('✅ [DASHBOARD] User authenticated:', user.email, 'ID:', user.id)

    // Get user profile with role - 성능 최적화: 필요한 필드만 선택
    console.log('🔍 [DASHBOARD] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status, organization_id, site_id, created_at, updated_at')
      .eq('id', user.id)
      .limit(1)
      .single()

    if (profileError) {
      console.error('❌ [DASHBOARD] Profile fetch error:', profileError)
      // Don't crash on profile error, continue with basic user info
    } else {
      console.log('✅ [DASHBOARD] Profile fetched:', profile?.full_name, 'Role:', profile?.role)
    }

    // If profile doesn't exist, create a basic one
    if (!profile) {
      console.log('🔍 [DASHBOARD] Creating profile for user:', user.id)
      
      // Determine role based on email
      let role = 'worker'
      if (user.email?.endsWith('@inopnc.com')) {
        if (user.email === 'admin@inopnc.com') role = 'admin'
        else if (user.email === 'manager@inopnc.com') role = 'site_manager'
      } else if (user.email === 'customer@inopnc.com') {
        role = 'customer_manager'
      } else if (user.email === 'davidswyang@gmail.com') {
        role = 'admin' // Use unified admin role
      }

      try {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: role,
            status: 'active',
            organization_id: user.email?.endsWith('@inopnc.com') || user.email === 'davidswyang@gmail.com' 
              ? '11111111-1111-1111-1111-111111111111'
              : user.email === 'customer@inopnc.com'
              ? '22222222-2222-2222-2222-222222222222'
              : null,
            site_id: (role === 'worker' || role === 'site_manager') 
              ? '11111111-1111-1111-1111-111111111111'
              : null
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ [DASHBOARD] Failed to create profile:', insertError)
          // Show error page
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">프로필 생성 실패</h1>
                <p className="text-gray-600 mb-4">프로필을 생성하는 중 오류가 발생했습니다.</p>
                <p className="text-sm text-gray-500">{insertError.message}</p>
                <a href="/auth/login" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                  다시 로그인하기
                </a>
              </div>
            </div>
          )
        }

        if (newProfile) {
          console.log('✅ [DASHBOARD] New profile created:', newProfile.full_name, 'Role:', newProfile.role)
          
          // Redirect admin users to admin dashboard
          if (newProfile.role === 'admin' || newProfile.role === 'system_admin') {
            redirect('/dashboard/admin')
          }
          
          // Pre-fetch site data for new profile with error handling
          let currentSite = null
          let siteHistory = []
          
          try {
            console.log('🔍 [DASHBOARD] Pre-fetching site data for new profile...')
            const [currentSiteResult, historyResult] = await Promise.allSettled([
              getCurrentUserSite(),
              getUserSiteHistory()
            ])
            
            if (currentSiteResult.status === 'fulfilled' && currentSiteResult.value.success) {
              currentSite = currentSiteResult.value.data
              console.log('✅ [DASHBOARD] Current site fetched for new profile')
            } else {
              console.log('⚠️ [DASHBOARD] No current site for new profile')
            }
            
            if (historyResult.status === 'fulfilled' && historyResult.value.success) {
              siteHistory = historyResult.value.data
              console.log('✅ [DASHBOARD] Site history fetched for new profile')
            } else {
              console.log('⚠️ [DASHBOARD] No site history for new profile')
            }
          } catch (error) {
            console.error('❌ [DASHBOARD] Error pre-fetching site data for new profile:', error)
            // Continue without site data
          }
          
          console.log('🚀 [DASHBOARD] Rendering dashboard with new profile')
          return <DashboardWithNotifications 
            user={user} 
            profile={newProfile as any}
            initialCurrentSite={currentSite}
            initialSiteHistory={siteHistory}
          />
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Error creating profile:', error)
        // Fall back to basic error page
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">서버 오류</h1>
              <p className="text-gray-600 mb-4">프로필을 처리하는 중 오류가 발생했습니다.</p>
              <a href="/auth/login" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                다시 로그인하기
              </a>
            </div>
          </div>
        )
      }
    }

    // Pre-fetch site data on server side to avoid client authentication issues
    // 성능 최적화: 병렬로 사이트 정보 가져오기
    let currentSite = null
    let siteHistory = []
    
    try {
      console.log('🔍 [DASHBOARD] Pre-fetching site data for existing profile:', user.email)
      
      // 병렬로 사이트 정보 가져오기 (성능 개선)
      const [currentSiteResult, historyResult] = await Promise.allSettled([
        getCurrentUserSite(),
        getUserSiteHistory()
      ])
      
      // 현재 사이트 결과 처리
      if (currentSiteResult.status === 'fulfilled' && currentSiteResult.value.success && currentSiteResult.value.data) {
        currentSite = currentSiteResult.value.data
        console.log('✅ [DASHBOARD] Current site found:', currentSite.site_name)
      } else if (currentSiteResult.status === 'rejected') {
        console.log('⚠️ [DASHBOARD] Current site fetch failed:', currentSiteResult.reason)
      } else {
        console.log('⚠️ [DASHBOARD] No current site:', currentSiteResult.value?.error)
      }
      
      // 사이트 히스토리 결과 처리
      if (historyResult.status === 'fulfilled' && historyResult.value.success && historyResult.value.data) {
        siteHistory = historyResult.value.data
        console.log('✅ [DASHBOARD] Site history found:', siteHistory.length, 'records')
      } else if (historyResult.status === 'rejected') {
        console.log('⚠️ [DASHBOARD] Site history fetch failed:', historyResult.reason)
      } else {
        console.log('⚠️ [DASHBOARD] No site history:', historyResult.value?.error)
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error pre-fetching site data:', error)
      // Continue without site data - don't crash the page
    }
    
    console.log('🚀 [DASHBOARD] Rendering dashboard with existing profile')
    return <DashboardWithNotifications 
      user={user} 
      profile={profile as any} 
      initialCurrentSite={currentSite}
      initialSiteHistory={siteHistory}
    />
    
  } catch (error) {
    console.error('💥 [DASHBOARD] Critical error in dashboard page:', error)
    
    // Return safe fallback page instead of crashing
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">시스템 오류</h1>
          <p className="text-gray-600 mb-4">
            대시보드를 로드하는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            잠시 후 다시 시도해주세요.
          </p>
          <div className="space-y-2">
            <button 
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </button>
            <a 
              href="/auth/login"
              className="w-full inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-center"
            >
              로그인 페이지로 이동
            </a>
          </div>
        </div>
      </div>
    )
  }
}