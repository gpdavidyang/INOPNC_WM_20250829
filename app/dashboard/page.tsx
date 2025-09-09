import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardWithNotifications from '@/components/dashboard/dashboard-with-notifications'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'

// 배포 환경에서 동적 렌더링 강제 - 현장 정보 로딩 문제 해결
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Get authenticated user using our session utility
  const user = await getAuthenticatedUser()
  
  // This should not happen if middleware is working correctly
  if (!user) {
    console.error('No user in dashboard page - middleware should have caught this')
    redirect('/auth/login')
  }

  // Get user profile with role - 성능 최적화: 필요한 필드만 선택
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, organization_id, site_id, created_at, updated_at')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  }

  // If profile doesn't exist, create a basic one
  if (!profile) {
    console.log('Creating profile for user:', user.id)
    
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
      console.error('Failed to create profile:', insertError)
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
      // Redirect admin users to admin dashboard
      if (newProfile.role === 'admin' || newProfile.role === 'system_admin') {
        redirect('/dashboard/admin')
      }
      // Pre-fetch site data for new profile
      let currentSite = null
      let siteHistory = []
      
      try {
        const [currentSiteResult, historyResult] = await Promise.allSettled([
          getCurrentUserSite(),
          getUserSiteHistory()
        ])
        
        if (currentSiteResult.status === 'fulfilled' && currentSiteResult.value.success) {
          currentSite = currentSiteResult.value.data
        }
        
        if (historyResult.status === 'fulfilled' && historyResult.value.success) {
          siteHistory = historyResult.value.data
        }
      } catch (error) {
        console.error('Error pre-fetching site data for new profile:', error)
      }
      
      return <DashboardWithNotifications 
        user={user} 
        profile={newProfile as any}
        initialCurrentSite={currentSite}
        initialSiteHistory={siteHistory}
      />
    }
  }

  // Redirect based on role - removed to prevent redirect loops
  // Role-based redirects are now handled in the signIn function
  // This page should only be accessed by worker and site_manager roles

  // Pre-fetch site data on server side to avoid client authentication issues
  // 성능 최적화: 병렬로 사이트 정보 가져오기
  let currentSite = null
  let siteHistory = []
  
  try {
    console.log('🔍 [DASHBOARD-SERVER] Pre-fetching site data for user:', user.email, 'ID:', user.id)
    
    // 병렬로 사이트 정보 가져오기 (성능 개선)
    const [currentSiteResult, historyResult] = await Promise.allSettled([
      getCurrentUserSite(),
      getUserSiteHistory()
    ])
    
    // 현재 사이트 결과 처리
    if (currentSiteResult.status === 'fulfilled' && currentSiteResult.value.success && currentSiteResult.value.data) {
      currentSite = currentSiteResult.value.data
      console.log('✅ [DASHBOARD-SERVER] Current site found:', currentSite.site_name)
    } else if (currentSiteResult.status === 'rejected') {
      console.log('⚠️ [DASHBOARD-SERVER] Current site fetch failed:', currentSiteResult.reason)
    } else {
      console.log('⚠️ [DASHBOARD-SERVER] No current site:', currentSiteResult.value?.error)
    }
    
    // 사이트 히스토리 결과 처리
    if (historyResult.status === 'fulfilled' && historyResult.value.success && historyResult.value.data) {
      siteHistory = historyResult.value.data
      console.log('✅ [DASHBOARD-SERVER] Site history found:', siteHistory.length, 'records')
    } else if (historyResult.status === 'rejected') {
      console.log('⚠️ [DASHBOARD-SERVER] Site history fetch failed:', historyResult.reason)
    } else {
      console.log('⚠️ [DASHBOARD-SERVER] No site history:', historyResult.value?.error)
    }
  } catch (error) {
    console.error('❌ [DASHBOARD-SERVER] Error pre-fetching site data:', error)
  }
  
  // console.log('🔍 [DASHBOARD-SERVER] Final data summary:', {
  //   hasCurrentSite: !!currentSite,
  //   hasSiteHistory: siteHistory.length > 0,
  //   userEmail: user.email,
  //   profileRole: profile?.role
  // })

  return <DashboardWithNotifications 
    user={user} 
    profile={profile as any} 
    initialCurrentSite={currentSite}
    initialSiteHistory={siteHistory}
  />
}