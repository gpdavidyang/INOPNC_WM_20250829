import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '알림 센터 (준비 중)',
}

export default async function NotificationCenterPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="알림 관리"
        description="시스템 알림 및 공지 관리 화면은 재구성 중입니다."
      >
        <p>알림 템플릿과 발송 이력 관리는 Phase 2 데이터 정비 이후 복원할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
