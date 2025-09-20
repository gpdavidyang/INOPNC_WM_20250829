import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '일일보고 관리 (준비 중)',
}

export default async function AdminDailyReportsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="일일보고 관리"
        description="일일보고 목록 및 상세 관리 UI는 Phase 2에서 다시 제공될 예정입니다."
      >
        <p>보고서 목록/승인/첨부 기능은 관리자 API가 준비되는 시점에 맞춰 복구합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
