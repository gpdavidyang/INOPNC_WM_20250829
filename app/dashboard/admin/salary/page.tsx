import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: '급여 관리 (준비 중)',
}

const SalarySnapshotTool = dynamic(() => import('./SalarySnapshotTool'), { ssr: false })

export default async function AdminSalaryPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">급여 관리</h1>
        <p className="text-sm text-gray-600 mt-1">월 합산 급여 스냅샷 발행과 HTML 보기 도구</p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <SalarySnapshotTool />
      </div>
    </div>
  )
}
