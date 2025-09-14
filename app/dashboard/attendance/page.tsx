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
    
  // Profile logging disabled for production performance

  if (!profile) {
    redirect('/auth/login')
  }

  // Attendance logging disabled for production performance

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