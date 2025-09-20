import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '모니터링 (준비 중)',
}

export default async function AdminMonitoringPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="시스템 모니터링"
        description="실시간 모니터링 화면은 현재 리팩토링 중입니다."
      >
        <p>알림/로그 모니터링 API 준비 후 UI를 다시 제공하겠습니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
