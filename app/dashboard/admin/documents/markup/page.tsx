import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '마크업 문서 (준비 중)',
}

export default async function AdminMarkupDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="마크업 문서 관리"
        description="문서 마크업/주석 기능은 현재 리팩토링 중입니다."
      >
        <p>Phase 2에서 문서 마크업 편집기와 저장 API를 정리한 뒤 UI를 재도입할 계획입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
