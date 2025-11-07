import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import PartnersOverview from '@/components/admin/partners/PartnersOverview'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '자재거래처 관리',
}

export default async function AdminPartnersPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="자재거래처 관리"
        description="‘거래처’는 원료를 공급하는 공급처와 당사 제품을 매입하는 판매처를 포함합니다"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재거래처 관리' },
        ]}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <PartnersOverview />
      </div>
    </div>
  )
}
