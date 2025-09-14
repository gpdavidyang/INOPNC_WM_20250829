import { createClient } from "@/lib/supabase/server"
import PartnerDashboardClient from './partner-dashboard-client'

export default async function PartnerDashboardPage() {
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

  if (profileError || !profile || profile.role !== 'customer_manager') {
    redirect('/dashboard')
  }

  // Get partner's sites through site_partners
  const { data: sitePartnerships } = await supabase
    .from('site_partners')
    .select(`
      *,
      sites(*)
    `)
    .eq('partner_company_id', profile.partner_company_id)
    .order('assigned_date', { ascending: false })

  // Get recent daily reports from partner's sites
  const siteIds = sitePartnerships?.map(sp => sp.site_id) || []
  const { data: recentReports } = await supabase
    .from('daily_reports')
    .select(`
      *,
      sites(name),
      profiles!daily_reports_created_by_fkey(full_name)
    `)
    .in('site_id', siteIds)
    .order('report_date', { ascending: false })
    .limit(10)

  // Get workers from partner company
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .eq('partner_company_id', profile.partner_company_id)
    .in('role', ['worker', 'site_manager'])

  // Calculate statistics
  const statistics = {
    totalSites: sitePartnerships?.length || 0,
    activeSites: sitePartnerships?.filter(sp => sp.sites?.status === 'active').length || 0,
    totalWorkers: workers?.length || 0,
    recentReports: recentReports?.length || 0
  }

  return (
    <PartnerDashboardClient 
      profile={profile}
      statistics={statistics}
      sitePartnerships={sitePartnerships || []}
      recentReports={recentReports || []}
      workers={workers || []}
    />
  )
}