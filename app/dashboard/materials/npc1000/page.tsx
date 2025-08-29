import { getProfile } from '@/app/actions/profile'
import { getSites } from '@/app/actions/sites'
import { NPC1000InventoryDashboard } from '@/components/materials/npc1000/NPC1000InventoryDashboard'
import { redirect } from 'next/navigation'
import { PageLayout } from '@/components/dashboard/page-layout'

export default async function NPC1000Page() {
  const profileResult = await getProfile()
  if (!profileResult.success || !profileResult.data) {
    redirect('/auth/login')
  }

  const sitesResult = await getSites()
  const sites = sitesResult.success ? sitesResult.data || [] : []

  return (
    <PageLayout
      title="NPC-1000 관리"
      description="NPC-1000 자재의 재고 현황 및 거래 내역을 관리합니다"
    >
      <NPC1000InventoryDashboard 
        currentUser={profileResult.data}
        sites={sites as any}
      />
    </PageLayout>
  )
}