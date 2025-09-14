import { createClient } from "@/lib/supabase/server"
import { DailyReportsPageClient } from '@/components/daily-reports/daily-reports-page-client'

export default async function DailyReportsPage() {
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

  // Get sites - simplified since organization relationships aren't set up
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  // Logging disabled for production performance

  // Check if user can create reports
  const canCreateReport = profile?.role && ['worker', 'site_manager', 'admin'].includes(profile.role)
  
  return (
    <DailyReportsPageClient 
      profile={profile as any}
      sites={sites || []}
    />
  )
}