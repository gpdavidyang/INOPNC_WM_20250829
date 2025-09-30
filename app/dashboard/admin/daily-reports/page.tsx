import type { Metadata } from 'next'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
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
  const siteNameQuery = ((searchParams?.site_name as string) || '').trim()
  let siteId = ((searchParams?.site_id as string) || (searchParams?.site as string) || '').trim()
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

      {/* 필터 */}
      <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <input type="hidden" name="page" value="1" />
          <div>
            <label className="block text-sm text-muted-foreground mb-1">현장명</label>
            <Input
              list="site-options"
              name="site_name"
              defaultValue={siteNameQuery}
              placeholder="현장명 검색"
            />
            <datalist id="site-options">
              {siteOptions.map(opt => (
                <option key={opt.id} value={opt.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">검색어</label>
            <Input name="search" defaultValue={search} placeholder="작성자/공종/특이사항 등" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">상태</label>
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled hidden>
                상태 선택
              </option>
              <option value="draft">임시저장</option>
              <option value="submitted">작성완료</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">시작일</label>
            <Input type="date" name="date_from" defaultValue={dateFrom} />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">종료일</label>
            <Input type="date" name="date_to" defaultValue={dateTo} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              적용
            </Button>
            <Link
              href="/dashboard/admin/daily-reports"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm border"
            >
              초기화
            </Link>
          </div>
        </form>
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
