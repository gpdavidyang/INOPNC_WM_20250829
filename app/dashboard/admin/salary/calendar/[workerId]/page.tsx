import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '근로자 급여 캘린더 (준비 중)',
}

interface WorkerCalendarPageProps {
  params: { workerId: string }
}

export default async function AdminWorkerSalaryCalendarPage({ params }: WorkerCalendarPageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`근로자 급여 캘린더 – ${params.workerId}`}
        description="근로자별 급여 캘린더는 현재 준비 중입니다."
      >
        <p>근태 데이터와 연동한 급여 계산 화면은 Phase 2에서 제공될 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
