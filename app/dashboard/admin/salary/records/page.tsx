import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: '급여 레코드 목록',
}

const SalaryRecordsList = dynamic(() => import('./records-list'), { ssr: false })

export default async function AdminSalaryRecordsPage() {
  await requireAdminProfile()
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">급여 레코드</h1>
        <p className="text-sm text-gray-600 mt-1">월별 HTML 보기로 빠르게 확인하세요.</p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <SalaryRecordsList />
      </div>
    </div>
  )
}
