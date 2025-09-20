import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '조직 등록 (준비 중)',
}

export default async function AdminOrganizationCreatePage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="신규 조직 등록"
        description="조직 등록 폼은 현재 재설계 중입니다."
      >
        <p>필수 필드와 검증 로직이 확정되면 Phase 2에서 UI를 복원합니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
