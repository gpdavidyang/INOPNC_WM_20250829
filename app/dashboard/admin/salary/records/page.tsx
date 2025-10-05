import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '급여 레코드 목록',
}

const SalaryRecordsList = dynamic(() => import('./records-list'), { ssr: false })

export default async function AdminSalaryRecordsPage() {
  await requireAdminProfile()
  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="급여 레코드"
        description="월별 HTML 보기로 빠르게 확인"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '레코드' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border bg-white p-4">
          <SalaryRecordsList />
        </div>
      </div>
    </div>
  )
}
