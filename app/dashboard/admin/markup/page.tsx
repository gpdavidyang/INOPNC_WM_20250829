import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '도면 마킹 관리 (준비 중)',
}

export default async function MarkupManagementPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="도면 마킹 관리"
        description="도면 마킹 문서 관리 및 권한 설정 화면은 리팩토링 중입니다."
      >
        <p>Phase 2 API 작업과 연동하여 브라우저 기반 마킹 도구를 다시 제공할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
