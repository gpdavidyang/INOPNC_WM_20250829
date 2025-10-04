import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import PhotoGridReportsTable from '@/components/admin/PhotoGridReportsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'

export const metadata: Metadata = {
  title: '사진대지 리포트',
}

export default async function AdminPhotoGridReportsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const supabase = createClient()

  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(50, Math.max(10, limitRaw))
  const search = ((searchParams?.search as string) || '').trim()
  const site_id = ((searchParams?.site_id as string) || '').trim()
  const status = ((searchParams?.status as string) || '').trim()

  // Summary stats
  const { count: totalReports } = await supabase
    .from('photo_grid_reports')
    .select('id', { count: 'exact', head: true })

  const { data: latest } = await supabase
    .from('photo_grid_reports')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  // List
  let query = supabase
    .from('photo_grid_reports')
    .select(
      `
      id,
      title,
      status,
      file_url,
      file_name,
      file_size,
      created_at,
      daily_report:daily_reports(
        work_date,
        site:sites(id,name)
      ),
      generated_by_profile:profiles!generated_by(full_name,email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)
  if (site_id) query = query.eq('daily_report.site_id', site_id)
  if (status) query = query.eq('status', status)

  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query
  const reports = Array.isArray(data) ? data : []
  const total = count || 0
  const pages = Math.max(1, Math.ceil(total / limit))

  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (site_id) params.set('site_id', site_id)
    params.set('limit', String(limit))
    params.set('page', String(nextPage))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">사진대지 리포트</h1>
        <p className="text-sm text-muted-foreground">생성된 사진대지 PDF 보고서</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>총 리포트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalReports ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>최근 생성일</CardTitle>
            <CardDescription>마지막 생성 시각</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {latest?.[0]?.created_at
                ? new Date(latest[0].created_at).toLocaleString('ko-KR')
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <form
          method="GET"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <input type="hidden" name="page" value="1" />
          <div className="lg:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">검색어</label>
            <Input name="search" defaultValue={search} placeholder="제목" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">현장 ID</label>
            <Input name="site_id" defaultValue={site_id} placeholder="site_id" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">상태</label>
            <Input name="status" defaultValue={status} placeholder="active/archived/pending" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">페이지 크기</label>
            <select
              name="limit"
              defaultValue={String(limit)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex gap-2">
            <Button type="submit" variant="outline">
              {t('common.apply')}
            </Button>
            <Link
              href="/dashboard/admin/photo-grid-reports"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            >
              {t('common.reset')}
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <PhotoGridReportsTable reports={reports} />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total}건 중 {(page - 1) * limit + Math.min(1, total)}–{Math.min(page * limit, total)}{' '}
            표시
          </div>
          <div className="flex gap-2">
            <Link
              href={buildQuery(Math.max(1, page - 1))}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              {t('common.prev')}
            </Link>
            <Link
              href={buildQuery(Math.min(pages, page + 1))}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}
            >
              {t('common.next')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
