'use client'

import { User } from '@supabase/supabase-js'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import SiteInfoTabs from './SiteInfoTabs'
import { Profile, CurrentUserSite, UserSiteHistory } from '@/types'

interface SiteInfoPageClientProps {
  user: User
  profile: Profile
  initialCurrentSite: CurrentUserSite | null
  initialSiteHistory: UserSiteHistory[]
}

export default function SiteInfoPageClient({
  user,
  profile,
  initialCurrentSite,
  initialSiteHistory
}: SiteInfoPageClientProps) {
  return (
    <DashboardLayout 
      user={user} 
      profile={profile}
      initialActiveTab="site-info"
    >
      <SiteInfoTabs 
        initialCurrentSite={initialCurrentSite}
        initialSiteHistory={initialSiteHistory}
        currentUser={profile}
      />
    </DashboardLayout>
  )
}