import { ProfilePageClient } from '@/components/profile/ProfilePageClient'

export default async function ProfilePage() {
  // Get user profile for authentication using the same pattern as other pages
  const profileResult = await getProfile()
  if (!profileResult.success || !profileResult.data) {
    redirect('/auth/login')
  }

  // Get Supabase user for dashboard layout
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get full profile with notification preferences
  const { data: fullProfile } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(name),
      site:sites(name, address),
      notification_preferences,
      push_subscription,
      push_subscription_updated_at
    `)
    .eq('id', user.id)
    .single()

  // Use the profile from the action as fallback if full profile fetch fails
  const profile = fullProfile || profileResult.data

  return (
    <DashboardLayout 
      user={user} 
      profile={profile as any}
    >
      <div className="h-full bg-gray-50 dark:bg-gray-900">
        {/* 모바일 최적화된 컨테이너 - UI Guidelines 적용 */}
        <div className="max-w-2xl mx-auto">
          {/* 페이지 헤더 - 고밀도 정보 레이아웃 */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1 text-construction-xl">
              내정보
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              개인 정보 및 설정을 관리합니다
            </p>
          </div>
          <ProfilePageClient 
            user={user}
            profile={profile as any}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}