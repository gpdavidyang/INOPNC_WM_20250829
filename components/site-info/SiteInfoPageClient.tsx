'use client'

import SiteInfoTabs from './SiteInfoTabs'

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