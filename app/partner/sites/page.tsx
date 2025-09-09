import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnerSitesClient from './partner-sites-client'

export default async function PartnerSitesPage() {
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

  // Get all sites assigned to this partner company
  const { data: sitePartnerships, error: sitesError } = await supabase
    .from('site_partners')
    .select(`
      *,
      sites(
        *,
        profiles!sites_site_manager_fkey(full_name, email, phone)
      )
    `)
    .eq('partner_company_id', profile.partner_company_id)
    .order('assigned_date', { ascending: false })

  if (sitesError) {
    console.error('Error fetching partner sites:', sitesError)
  }

  // Get daily reports count for each site
  const siteIds = sitePartnerships?.map(sp => sp.site_id) || []
  const { data: reportCounts } = await supabase
    .from('daily_reports')
    .select('site_id')
    .in('site_id', siteIds)
    .eq('status', 'submitted')

  // Count reports per site
  const reportCountMap = reportCounts?.reduce((acc, report) => {
    acc[report.site_id] = (acc[report.site_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Get worker counts for each site
  const { data: workerCounts } = await supabase
    .from('site_assignments')
    .select('site_id, user_id')
    .in('site_id', siteIds)
    .eq('is_active', true)

  const workerCountMap = workerCounts?.reduce((acc, assignment) => {
    acc[assignment.site_id] = (acc[assignment.site_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <PartnerSitesClient 
      profile={profile}
      sitePartnerships={sitePartnerships || []}
      reportCountMap={reportCountMap}
      workerCountMap={workerCountMap}
    />
  )
}