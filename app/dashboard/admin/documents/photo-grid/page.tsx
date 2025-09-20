import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '포토 그리드 문서 (준비 중)',
}

export default async function AdminPhotoGridDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="포토 그리드 문서 관리"
        description="사진 기반 문서 관리 화면은 현재 재구성 중입니다."
      >
        <p>관련 API 및 스토리지 정책 정비 후 다시 제공될 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
