import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '마크업 도구 (준비 중)',
}

export default async function AdminMarkupToolPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="문서 마크업 도구"
        description="브라우저 마크업 에디터는 현재 재작성 중입니다."
      >
        <p>파일 주석 도구 및 저장 기능은 곧 제공될 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
