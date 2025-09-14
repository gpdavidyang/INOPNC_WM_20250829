'use client'

import NPC1000DailyDashboard from './npc1000/NPC1000DailyDashboard'

interface MaterialManagementSimplifiedProps {
  materials: unknown[]
  categories: unknown[]
  initialInventory: unknown[]
  currentUser: unknown
  currentSite?: unknown
}

export function MaterialManagementSimplified({ 
  materials, 
  categories, 
  initialInventory, 
  currentUser, 
  currentSite 
}: MaterialManagementSimplifiedProps) {
  return (
    <NPC1000DailyDashboard 
      currentSiteId={currentSite?.site_id}
      currentSiteName={currentSite?.site_name}
    />
  )
}