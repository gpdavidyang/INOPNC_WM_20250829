import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { OrganizationsOverview } from '@/components/admin/organizations/OrganizationsOverview'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '조직 관리',
}

export default async function AdminOrganizationsPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="조직 관리"
        description="원도급/협력 조직을 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '조직 관리' }]}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <OrganizationsOverview />
      </div>
    </div>
  )
}
