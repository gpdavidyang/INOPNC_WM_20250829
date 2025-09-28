import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/utils'

export const metadata: Metadata = {
  title: '포토 그리드 문서',
}

export default async function AdminPhotoGridDocumentsPage({
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
  const status = ((searchParams?.status as string) || '').trim()
  const site_id = ((searchParams?.site_id as string) || '').trim()

  let query = supabase
    .from('photo_grid_reports')
    .select(
      `
      id,
      title,
      file_url,
      file_name,
      file_size,
      status,
      created_at,
      daily_report:daily_reports(
        work_date,
        site:sites(id,name)
      ),
      generated_by_profile:profiles!generated_by(
        full_name,
        email
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (site_id) {
    query = query.eq('daily_report.site_id', site_id)
  }

  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query
  const total = count || 0
  const pages = Math.max(1, Math.ceil(total / limit))
  const reports = Array.isArray(data) ? data : []

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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">포토 그리드 문서</h1>
        <p className="text-sm text-muted-foreground">최근 생성된 사진대지 PDF 보고서입니다.</p>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <form
          method="GET"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <input type="hidden" name="page" value="1" />
          <div className="lg:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">검색어</label>
            <Input name="search" defaultValue={search} placeholder="제목 검색" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">상태</label>
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="archived">보관</option>
              <option value="pending">대기</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">현장 ID</label>
            <Input name="site_id" defaultValue={site_id} placeholder="site_id" />
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
              적용
            </Button>
            <Link
              href="/dashboard/admin/documents/photo-grid"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            >
              초기화
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>생성일</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>현장</TableHead>
              <TableHead>파일</TableHead>
              <TableHead>생성자</TableHead>
              <TableHead>동작</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                  표시할 문서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleString('ko-KR')}</TableCell>
                  <TableCell className="font-medium text-foreground">{r.title || '-'}</TableCell>
                  <TableCell>{r.daily_report?.site?.name || '-'}</TableCell>
                  <TableCell title={r.file_name || ''}>
                    {r.file_size ? formatBytes(r.file_size) : '-'}
                  </TableCell>
                  <TableCell>
                    {r.generated_by_profile?.full_name || r.generated_by_profile?.email || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {r.file_url ? (
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-blue-600"
                        >
                          다운로드
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      <Link
                        href={`/dashboard/admin/tools/photo-grids/preview/${r.id}`}
                        className="underline text-blue-600"
                      >
                        미리보기
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
              이전
            </Link>
            <Link
              href={buildQuery(Math.min(pages, page + 1))}
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
