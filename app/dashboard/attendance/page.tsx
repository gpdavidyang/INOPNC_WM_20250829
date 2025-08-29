import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import { AttendancePageClient } from '@/components/attendance/attendance-page-client'

export default async function AttendancePage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with organization and site info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*),
      site:sites(*)
    `)
    .eq('id', user.id)
    .single()
    
  console.log('Profile query result:', { 
    profile, 
    error: profileError,
    site_id: profile?.site_id 
  })

  if (!profile) {
    redirect('/auth/login')
  }

  console.log('AttendancePage: Profile data loaded:', {
    hasProfile: !!profile,
    profileId: profile?.id,
    profileRole: profile?.role,
    profileFullName: profile?.full_name,
    profileEmail: profile?.email
  })

  const isPartnerCompany = profile?.role === 'customer_manager'

  return (
    <DashboardLayout 
      user={user} 
      profile={profile as any}
    >
      <AttendancePageClient 
        profile={profile}
        isPartnerCompany={isPartnerCompany}
      />
    </DashboardLayout>
  )
}