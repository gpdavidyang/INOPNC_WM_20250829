import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { OrganizationsOverview } from '@/components/admin/organizations/OrganizationsOverview'

export const metadata: Metadata = {
  title: '조직 관리',
}

export default async function AdminOrganizationsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <OrganizationsOverview />
    </div>
  )
}
