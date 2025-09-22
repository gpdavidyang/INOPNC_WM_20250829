import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '커뮤니케이션 센터 (준비 중)',
}

export default async function CommunicationManagementPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="커뮤니케이션 모듈"
        description="공지/요청/알림 통합 화면은 현재 경량화 작업 중입니다."
      >
        <p>Phase 2 일정에서 실시간 알림 및 공지 기능을 새로운 데이터 모델로 재도입할 예정입니다.</p>
        <p>당분간은 모듈 상태 관리를 위한 Placeholder UI를 유지합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
