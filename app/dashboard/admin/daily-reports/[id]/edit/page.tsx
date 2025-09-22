import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '일일보고 수정 (준비 중)',
}

interface DailyReportEditPageProps {
  params: { id: string }
}

export default async function AdminDailyReportEditPage({ params }: DailyReportEditPageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`일일보고 수정 – ${params.id}`}
        description="일일보고 작성/수정 화면은 재구성 중입니다."
      >
        <p>폼 구성과 검증 로직은 Phase 2에서 새로운 API와 함께 제공할 계획입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
