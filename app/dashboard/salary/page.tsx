import { createClient } from "@/lib/supabase/server"
import { SalaryView } from '@/components/attendance/salary-view'

export default async function SalaryPage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*),
      site:sites(*)
    `)
    .eq('id', user.id)
    .single()
    
  if (!profile) {
    redirect('/auth/login')
  }

  // 관리자는 관리자 페이지로 리다이렉트
  if (profile.role === 'admin' || profile.role === 'system_admin') {
    redirect('/dashboard/admin/salary')
  }

  return (
    <DashboardLayout 
      user={user} 
      profile={profile as any}
    >
      <div className="h-full bg-white dark:bg-gray-900 p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            급여 정보
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {profile.role === 'site_manager' ? '현장관리자' : '작업자'} 급여 내역
          </p>
        </div>
        <SalaryView profile={profile} />
      </div>
    </DashboardLayout>
  )
}