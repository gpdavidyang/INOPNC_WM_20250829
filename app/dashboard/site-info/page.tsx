import { getCurrentUserSite } from "@/app/actions/site-info"
import { getProfile } from "@/lib/auth/profile"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from '@/components/dashboard/dashboard-layout'

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

  // Fetch current site and history on server side with error handling
  let currentSiteResult, historyResult
  try {
    [currentSiteResult, historyResult] = await Promise.all([
      getCurrentUserSite(),
      getUserSiteHistory()
    ])
  } catch (error) {
    console.error('[Site Info Page] Server-side fetch error:', error)
    // Provide fallback data
    currentSiteResult = { success: false, error: 'Failed to load site information' }
    historyResult = { success: false, error: 'Failed to load site history' }
  }

  console.log('[Site Info Page] Server results:', {
    currentSiteResult,
    historyResult,
    userEmail: user.email
  })

  const currentSite = currentSiteResult.success ? currentSiteResult.data : null
  const siteHistory = historyResult.success ? historyResult.data || [] : []
  
  // Pass error information to component for user feedback
  const errors = {
    currentSite: !currentSiteResult.success ? currentSiteResult.error : null,
    siteHistory: !historyResult.success ? historyResult.error : null
  }

  return (
    <DashboardLayout 
      user={user} 
      profile={profileResult.data}
    >
      <SiteInfoTabNew />
    </DashboardLayout>
  )
}