import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReports } from '@/app/actions/admin/daily-reports'
// Badge used inside client table
import DailyReportsTable from '@/components/admin/DailyReportsTable'

export const metadata: Metadata = {
  title: '일일보고 관리',
}

export default async function AdminDailyReportsPage() {
  await requireAdminProfile()

  // 기본 목록 20건 로드 (최근일자 우선)
  const result = await getDailyReports({
    page: 1,
    itemsPerPage: 20,
    sortField: 'work_date',
    sortDirection: 'desc',
  })
  const reports =
    result.success && Array.isArray(result.data?.reports) ? (result.data as any).reports : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">일일보고 관리</h1>
        <p className="text-sm text-muted-foreground">최근 등록된 작업일지 목록입니다.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <DailyReportsTable reports={reports} />
      </div>
    </div>
  )
}
