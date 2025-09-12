import { getProfile } from '@/app/actions/profile'
import { getCurrentUserSite } from '@/app/actions/site-info'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import SiteInfoCardNew from '@/components/site-info/SiteInfoCardNew'

export default async function SiteInfoCardPage() {
  // Get user profile for authentication
  const profileResult = await getProfile()
  if (!profileResult.success || !profileResult.data) {
    redirect('/auth/login')
  }

  // Get Supabase user for dashboard layout
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch current site with error handling
  let currentSiteResult
  try {
    currentSiteResult = await getCurrentUserSite()
  } catch (error) {
    console.error('[Site Info Card Page] Server-side fetch error:', error)
    currentSiteResult = { success: false, error: 'Failed to load site information' }
  }

  const currentSite = currentSiteResult.success ? currentSiteResult.data : null

  return (
    <DashboardLayout 
      user={user} 
      profile={profileResult.data}
    >
      <div className="max-w-3xl mx-auto">
        <SiteInfoCardNew 
          currentSite={currentSite}
          currentUser={profileResult.data}
        />
      </div>
    </DashboardLayout>
  )
}