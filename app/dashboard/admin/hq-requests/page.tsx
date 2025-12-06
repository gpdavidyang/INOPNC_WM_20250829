import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import RequestsTab from '@/components/admin/legacy/communication/tabs/RequestsTab'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '본사요청 관리',
}

export default async function HeadquartersRequestsPage() {
  const profile = await requireAdminProfile()

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="본사요청 관리"
        description="모바일·현장팀에서 접수된 본사 요청사항을 확인하고 처리합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '본사요청 관리' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <RequestsTab profile={profile} />
        </div>
      </div>
    </div>
  )
}
