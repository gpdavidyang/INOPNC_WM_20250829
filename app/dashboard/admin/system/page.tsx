import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '시스템 관리 (준비 중)',
}

export default async function SystemManagementPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="시스템 관리"
        description="시스템 설정, 백업 관리, 감사 로그 화면은 재구성 중입니다."
      >
        <p>Phase 2 일정에서 운영 가이드에 맞게 시스템 모듈을 복구할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
