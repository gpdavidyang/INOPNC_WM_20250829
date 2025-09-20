import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '통합 대시보드 (준비 중)',
}

export default async function AdminIntegratedDashboardPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="통합 관리자 대시보드"
        description="통합 지표 화면은 Phase 2 API 정비 후 재구성될 예정입니다."
      >
        <p>현재는 시스템 통계/데이터 파이프라인을 검토 중이므로 임시로 접근을 제한합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
