import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '필수 문서 유형 (준비 중)',
}

export default async function AdminDocumentRequirementsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="필수 문서 유형 관리"
        description="필수 문서 템플릿 및 관리 기능은 재정비 중입니다."
      >
        <p>Phase 2에서 문서 유형 정의 및 승인 프로세스를 확정한 뒤 UI를 복원합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
