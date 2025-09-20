import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '사용자 관리 (준비 중)',
}

export default async function AdminUsersPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="사용자 관리"
        description="사용자 목록 및 권한 관리 화면은 재정비 중입니다."
      >
        <p>Phase 2에서 인증/권한 API를 정리하고 나서 UI를 복원할 계획입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
