
// 개발용 페이지 - SERVICE ROLE KEY 사용으로 RLS 우회
export default async function NewDailyReportDevPage() {
  // 일반 클라이언트로 인증 확인
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const authSupabase = createServerClient()
  
  const { data: { user }, error: authError } = await authSupabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Service Role 클라이언트로 데이터 가져오기 (RLS 우회)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Get user profile
  const { data: profile } = await serviceSupabase
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

  // Get ALL sites without RLS restrictions
  const { data: sites, error: sitesError } = await serviceSupabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')
  
  console.log('DEV MODE - Sites fetched:', { count: sites?.length, error: sitesError })
  
  const materials: unknown[] = []

  // Get workers
  const { data: workers } = await serviceSupabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'site_manager'])
    .eq('status', 'active')
    .order('full_name')

  return (
    <DashboardLayout user={user} profile={profile as any}>
      <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
        ⚠️ 개발 모드: RLS 우회 중
      </div>
      <DailyReportForm
        mode="create"
        sites={sites || []}
        currentUser={profile as any}
        materials={materials || []}
        workers={workers as unknown || []}
      />
    </DashboardLayout>
  )
}