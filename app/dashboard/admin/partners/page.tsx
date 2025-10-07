import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PartnersOverview } from '@/components/admin/partners/PartnersOverview'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '공급업체 관리',
}

export default async function AdminPartnersPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="공급업체 관리"
        description="공급업체 정보를 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '공급업체 관리' }]}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <PartnersOverview />
      </div>
    </div>
  )
}
