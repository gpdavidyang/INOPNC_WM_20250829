import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '공유 문서함 관리 (준비 중)',
}

export default async function SharedDocumentsManagementPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="공유 문서함 관리"
        description="공유 문서 업로드, 카테고리 관리, 권한 설정 화면은 재구성 중입니다."
      >
        <p>문서 통합 관리 개편에 맞춰 이 화면은 Placeholder 상태로 유지됩니다.</p>
        <p>필요한 기능은 Phase 2 API 작업 이후 우선순위에 따라 복원해 주세요.</p>
      </AdminPlaceholder>
    </div>
  )
}
