import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PartnersOverview } from '@/components/admin/partners/PartnersOverview'

export const metadata: Metadata = {
  title: '파트너 관리',
}

export default async function AdminPartnersPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <PartnersOverview />
    </div>
  )
}
