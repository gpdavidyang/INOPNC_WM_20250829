import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '도면 마크업 도구 (준비 중)',
}

export default async function AdminMarkupToolPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="도면 마크업 도구"
        description="실시간 마크업 도구는 경량화 작업 이후 복원될 예정입니다."
      >
        <p>모듈 리팩토링이 완료되면 저장 및 공유 기능과 함께 다시 제공할 계획입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
