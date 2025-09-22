import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '문서 업로드 (준비 중)',
}

export default async function AdminDocumentUploadPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="문서 업로드"
        description="문서 일괄 업로드 도구는 현재 리빌딩 중입니다."
      >
        <p>파일 변환/검증 파이프라인이 준비되면 해당 화면을 다시 게시할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
