import SalaryManagement from '@/components/admin/SalaryManagement'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SalaryManagementPage() {
  const supabase = createClient()
  
  // Check authentication and admin permissions
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Get user profile and check admin permissions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">급여 관리</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">작업자 급여 규칙 설정 및 급여 계산</p>
      </div>

      <SalaryManagement profile={profile} />
    </div>
  )
}