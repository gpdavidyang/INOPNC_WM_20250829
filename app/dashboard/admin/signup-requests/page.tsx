import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '가입 요청 관리 (준비 중)',
}

export default async function AdminSignupRequestsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="가입 요청 관리"
        description="가입 승인/거절 화면은 현재 리팩토링 중입니다."
      >
        <p>요청 목록 및 승인 플로우는 Phase 2에서 새 API 기준으로 제공될 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
