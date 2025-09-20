import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '내 문서 관리 (준비 중)',
}

export default async function AdminMyDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="내 문서 관리"
        description="개별 관리자의 문서함 기능은 준비 중입니다."
      >
        <p>개인 문서 열람 · 승인 흐름은 Phase 2에서 정리한 API와 연동해 복원할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
