import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '필수 문서 관리 (준비 중)',
}

export default async function AdminRequiredDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="필수 문서 관리"
        description="현장별 필수 문서 설정 화면은 Phase 2에서 다시 공개됩니다."
      >
        <p>현재는 필수 문서 목록 조회/관리 API가 준비되지 않아 UI를 임시 중단한 상태입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
