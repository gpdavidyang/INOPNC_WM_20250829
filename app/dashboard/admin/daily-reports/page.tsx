import type { Metadata } from 'next'
import Link from 'next/link'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReports } from '@/app/actions/admin/daily-reports'
import { DailyReportFilters } from '@/components/admin/DailyReportFilters'
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
  const siteNameQuery = ((searchParams?.site_name as string) || '').trim()
  let siteId = ((searchParams?.site_id as string) || (searchParams?.site as string) || '').trim()
  const createdBy = ((searchParams?.created_by as string) || '').trim()
  const statusParam = ((searchParams?.status as string) || '').trim()
  const status = statusParam === 'draft' || statusParam === 'submitted' ? statusParam : ''
  const dateFrom = ((searchParams?.date_from as string) || '').trim()
  const dateTo = ((searchParams?.date_to as string) || '').trim()
  const search = ((searchParams?.search as string) || '').trim()

  // Resolve siteId from site_name if provided (best-effort, no throw)
  if (!siteId && siteNameQuery) {
    const supabase = createClient()
    const { data: found, error } = await supabase
      .from('sites')
      .select('id,name')
      .ilike('name', `%${siteNameQuery}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!error && found?.id) siteId = String(found.id)
  }

  // Fetch sites for autocomplete (best-effort)
  let siteOptions: Array<{ id: string; name: string }> = []
  {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sites')
      .select('id,name')
      .order('created_at', { ascending: false })
      .limit(200)
    siteOptions =
      !error && Array.isArray(data)
        ? (data as any).map((s: any) => ({ id: String(s.id), name: String(s.name) }))
        : []
  }

  const result = await getDailyReports({
    page,
    itemsPerPage: limit,
    sortField: sort,
    sortDirection: dir,
    site: siteId || undefined,
    search: search || undefined,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    created_by: createdBy || undefined,
  })
  const reports =
    result.success && Array.isArray((result.data as any)?.reports)
      ? (result.data as any).reports
      : []
  const total = result.success ? ((result.data as any)?.totalCount ?? 0) : 0
  const pages = result.success ? Math.max(1, (result.data as any)?.totalPages ?? 1) : 1

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="작업일지 관리"
        description="최근 등록된 작업일지를 조회/검색합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '작업일지 관리' }]}
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/dashboard/admin/daily-reports/new"
            className="inline-flex items-center rounded-md bg-[--brand-600] hover:bg-[--brand-700] text-white px-4 py-2 text-sm shadow-button"
          >
            작업일지 작성
          </a>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 */}
        <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm">
          <DailyReportFilters
            siteOptions={siteOptions}
            initialSiteId={siteId || undefined}
            initialSearch={search || ''}
            initialStatus={status || ''}
            initialDateFrom={dateFrom || ''}
            initialDateTo={dateTo || ''}
          />
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <div className="mb-2 text-sm text-muted-foreground">
            총 {total.toLocaleString()}건 · 페이지 {page} / {pages}
          </div>
          <DailyReportsTable reports={reports} />
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {total}건 중 {(page - 1) * limit + Math.min(1, total)}-{Math.min(page * limit, total)}{' '}
              표시
            </div>
            <div className="flex gap-2">
              <Link
                href={`?${new URLSearchParams({ page: String(Math.max(1, page - 1)), limit: String(limit) })}`}
                className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                {t('common.prev')}
              </Link>
              <Link
                href={`?${new URLSearchParams({ page: String(Math.min(pages, page + 1)), limit: String(limit) })}`}
                className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}
              >
                {t('common.next')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
