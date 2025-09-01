import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'
import { getProfile } from '@/app/actions/profile'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import SiteInfoPageNew from '@/components/site-info/SiteInfoPageNew'

export default async function SiteInfoPage() {
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

  // Fetch current site and history on server side
  const [currentSiteResult, historyResult] = await Promise.all([
    getCurrentUserSite(),
    getUserSiteHistory()
  ])

  console.log('[Site Info Page] Server results:', {
    currentSiteResult,
    historyResult,
    userEmail: user.email
  })

  const currentSite = currentSiteResult.success ? currentSiteResult.data : null
  const siteHistory = historyResult.success ? historyResult.data || [] : []

  return (
    <DashboardLayout 
      user={user} 
      profile={profileResult.data}
    >
      <div className="space-y-3">
        <SiteInfoPageNew 
          initialCurrentSite={currentSite}
          initialSiteHistory={siteHistory}
          currentUser={profileResult.data}
        />
      </div>
    </DashboardLayout>
  )
}