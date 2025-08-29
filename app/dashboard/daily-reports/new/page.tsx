import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import DailyReportFormEnhanced from '@/components/daily-reports/daily-report-form-enhanced'

export default async function NewDailyReportPage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Check if user can create reports
  const allowedRoles = ['worker', 'site_manager', 'admin', 'system_admin']
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard/daily-reports')
  }

  // Get sites - try regular client first, fallback to service role if needed
  let sites, sitesError
  
  try {
    // First try with regular client
    const regularResult = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
      .order('name')
    
    if (regularResult.data && regularResult.data.length > 0) {
      sites = regularResult.data
      sitesError = regularResult.error
      console.log('Sites fetch SUCCESS with regular client:', sites.length)
    } else {
      // Fallback to service role
      const serviceSupabase = require('@supabase/supabase-js').createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      const serviceResult = await serviceSupabase
        .from('sites')
        .select('*')
        .eq('status', 'active')
        .order('name')
      
      sites = serviceResult.data
      sitesError = serviceResult.error
      console.log('Sites fetch with SERVICE ROLE (fallback):', sites?.length)
    }
  } catch (error) {
    console.error('Error fetching sites:', error)
    sites = []
    sitesError = error
  }

  // TODO: Get materials when materials table is created
  // const { data: materials } = await supabase
  //   .from('materials')
  //   .select(`
  //     *,
  //     category:material_categories(*)
  //   `)
  //   .eq('is_active', true)
  //   .order('name')
  
  const materials: any[] = []

  // Get workers for attendance - simplified query since organization relationships aren't set up
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'site_manager'])
    .eq('status', 'active')
    .order('full_name')

  return (
    <DashboardLayout user={user} profile={profile as any}>
      {/* 데이터가 없을 때만 경고 메시지 표시 */}
      {(!sites || sites.length === 0) && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">⚠️ 알림</span>
          </div>
          <p className="text-sm mt-1">
            현장 데이터를 불러올 수 없습니다. 관리자에게 문의하세요.
          </p>
        </div>
      )}
      
      <DailyReportFormEnhanced
        sites={sites || []}
        currentUser={profile as any}
        materials={materials || []}
        workers={workers as any || []}
      />
    </DashboardLayout>
  )
}