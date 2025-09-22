import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '공유 문서 (준비 중)',
}

export default async function AdminSharedDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="공유 문서 관리"
        description="조직 간 공유 문서 기능은 재정비 중입니다."
      >
        <p>Phase 2에서 문서 공유 권한 및 감사 로그 요구사항을 정리한 뒤 UI를 복원합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
