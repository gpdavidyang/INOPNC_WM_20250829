import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReports } from '@/app/actions/admin/daily-reports'
// Badge used inside client table
import DailyReportsTable from '@/components/admin/DailyReportsTable'

export const metadata: Metadata = {
  title: '작업일지 관리',
}

export default async function AdminDailyReportsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(100, Math.max(10, limitRaw))
  const sort = ((searchParams?.sort as string) || 'work_date').trim()
  const dir = ((searchParams?.dir as string) || 'desc').trim() as 'asc' | 'desc'

  const result = await getDailyReports({
    page,
    itemsPerPage: limit,
    sortField: sort,
    sortDirection: dir,
  })
  const reports =
    result.success && Array.isArray((result.data as any)?.reports)
      ? (result.data as any).reports
      : []
  const total = result.success ? ((result.data as any)?.totalCount ?? 0) : 0
  const pages = result.success ? Math.max(1, (result.data as any)?.totalPages ?? 1) : 1

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">작업일지 관리</h1>
        <p className="text-sm text-muted-foreground">최근 등록된 작업일지 목록입니다.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <div className="mb-2 text-sm text-muted-foreground">
          총 {total.toLocaleString()}건 · 페이지 {page} / {pages}
        </div>
        <DailyReportsTable reports={reports} />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total}건 중 {(page - 1) * limit + Math.min(1, total)}–{Math.min(page * limit, total)}{' '}
            표시
          </div>
          <div className="flex gap-2">
            <Link
              href={`?${new URLSearchParams({ page: String(Math.max(1, page - 1)), limit: String(limit) })}`}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              이전
            </Link>
            <Link
              href={`?${new URLSearchParams({ page: String(Math.min(pages, page + 1)), limit: String(limit) })}`}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}
            >
              다음
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
