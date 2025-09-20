import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '자재 관리 (준비 중)',
}

export default async function AdminMaterialsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="자재 관리"
        description="자재 재고 및 요청 관리 화면은 리팩토링 중입니다."
      >
        <p>자재 데이터 모델과 보고서 요구사항이 확정되면 Phase 2 일정에 맞춰 UI를 복원합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
