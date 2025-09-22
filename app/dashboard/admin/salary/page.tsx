import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '급여 관리 (준비 중)',
}

export default async function AdminSalaryPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="급여 관리"
        description="급여 계산 및 정산 화면은 재정비 중입니다."
      >
        <p>급여 규칙, 산출 및 보고 기능은 Phase 2에서 새 API와 함께 복원할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
