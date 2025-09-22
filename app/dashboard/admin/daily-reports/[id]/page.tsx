import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '일일보고 상세 (준비 중)',
}

interface DailyReportPageProps {
  params: { id: string }
}

export default async function AdminDailyReportDetailPage({ params }: DailyReportPageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`일일보고 상세 – ${params.id}`}
        description="일일보고 세부 정보와 승인 흐름은 현재 리팩토링 중입니다."
      >
        <p>사진, 첨부 파일, 작업자 현황 등 세부 기능은 Phase 2에서 복원할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
