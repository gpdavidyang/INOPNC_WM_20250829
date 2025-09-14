import PartnerWorkersClient from './partner-workers-client'

export default async function PartnerWorkersPage() {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with partner company details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      partner_companies(*)
    `)
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'customer_manager' || !profile.partner_company_id) {
    redirect('/dashboard')
  }

  // Get all workers from this partner company
  const { data: workers, error: workersError } = await supabase
    .from('profiles')
    .select(`
      *,
      site_assignments(
        site_id,
        assigned_date,
        is_active,
        sites(name, address, status)
      )
    `)
    .eq('partner_company_id', profile.partner_company_id)
    .in('role', ['worker', 'site_manager'])
    .order('full_name')

  if (workersError) {
    console.error('Error fetching partner workers:', workersError)
  }

  // Get attendance statistics for each worker (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const workerIds = workers?.map(w => w.id) || []
  const { data: attendanceData } = await supabase
    .from('daily_reports')
    .select('created_by, report_date, status')
    .in('created_by', workerIds)
    .gte('report_date', thirtyDaysAgo.toISOString().split('T')[0])
    .eq('status', 'submitted')

  // Calculate attendance stats
  const attendanceStats = attendanceData?.reduce((acc, report) => {
    if (!acc[report.created_by]) {
      acc[report.created_by] = { total: 0, lastReport: null }
    }
    acc[report.created_by].total++
    if (!acc[report.created_by].lastReport || report.report_date > acc[report.created_by].lastReport) {
      acc[report.created_by].lastReport = report.report_date
    }
    return acc
  }, {} as Record<string, { total: number, lastReport: string | null }>) || {}

  // Categorize workers
  const categorizedWorkers = {
    site_managers: workers?.filter(w => w.role === 'site_manager') || [],
    workers: workers?.filter(w => w.role === 'worker') || [],
    all: workers || []
  }

  return (
    <PartnerWorkersClient 
      profile={profile}
      workers={categorizedWorkers}
      attendanceStats={attendanceStats}
    />
  )
}