import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '현장 관리 (준비 중)',
}

export default async function AdminSitesPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="현장 관리"
        description="현장 목록 및 세부 관리 화면은 재설계 중입니다."
      >
        <p>현재는 현장 데이터 API/권한 모델을 점검하고 있으며, Phase 2에서 UI를 다시 제공할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
