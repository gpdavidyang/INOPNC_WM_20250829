import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMonthlyAttendance } from '@/app/actions/attendance'
import { AttendanceCalendarPageClient } from '@/components/attendance/attendance-calendar-page-client'

export default async function AttendanceCalendarPage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with site info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Check if user has a site assigned  
  const showNoSiteMessage = !profile.site || (Array.isArray(profile.site) && profile.site.length === 0)

  return (
    <AttendanceCalendarPageClient 
      profile={profile}
      showNoSiteMessage={showNoSiteMessage}
    />
  )
}