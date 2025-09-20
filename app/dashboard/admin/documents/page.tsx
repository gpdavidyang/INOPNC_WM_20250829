import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '문서 관리 (준비 중)',
}

export default async function AdminDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="문서 관리 모듈"
        description="통합 문서 관리 기능은 재구성 중입니다."
      >
        <p>문서함 네비게이션과 문서 유형별 관리 기능은 Phase 2에서 API 정비 이후 순차적으로 복원할 예정입니다.</p>
        <p>우선순위에 따라 필요한 화면부터 계획서(DY0920) 대로 재구현해 주세요.</p>
      </AdminPlaceholder>
    </div>
  )
}
