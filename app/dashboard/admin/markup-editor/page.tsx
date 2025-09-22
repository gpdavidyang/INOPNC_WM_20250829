import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '브라우저 마크업 에디터 (준비 중)',
}

export default async function AdminMarkupEditorPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="브라우저 마크업 에디터"
        description="기존 마크업 에디터는 모듈 재작성 중입니다."
      >
        <p>UI와 작업 흐름은 Phase 2 마크업 도구 개편 일정에 따라 다시 제공할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
