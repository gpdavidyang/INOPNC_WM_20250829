import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '사진대지 리포트 (준비 중)',
}

export default async function AdminPhotoGridReportsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="사진대지 리포트 관리"
        description="사진대지 보고서 생성/관리 화면은 재정비 중입니다."
      >
        <p>사진대지 템플릿과 승인 흐름은 Phase 2에서 API 정비 후 복원될 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
