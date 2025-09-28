import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getMarkupDocuments } from '@/app/actions/admin/markup'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '마크업 문서',
}

export default async function AdminMarkupDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(50, Math.max(10, limitRaw))
  const search = ((searchParams?.search as string) || '').trim()

  const result = await getMarkupDocuments(page, limit, search)
  const docs = result.success && result.data ? (result.data as any).documents : []
  const total = result.success && result.data ? (result.data as any).total : 0
  const pages = result.success && result.data ? Math.max(1, (result.data as any).pages) : 1

  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('limit', String(limit))
    params.set('page', String(nextPage))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">마크업 문서</h1>
        <p className="text-sm text-muted-foreground">최근 생성된 도면 마킹 문서 목록입니다.</p>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <form
          method="GET"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <input type="hidden" name="page" value="1" />
          <div className="lg:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">검색어</label>
            <Input name="search" defaultValue={search} placeholder="제목/설명/파일명" />
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
              href="/dashboard/admin/documents/markup"
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
              <TableHead>작성자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>보기</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                  표시할 문서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              docs.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.created_at).toLocaleString('ko-KR')}</TableCell>
                  <TableCell className="font-medium text-foreground">{d.title || '-'}</TableCell>
                  <TableCell>{d.site?.name || '-'}</TableCell>
                  <TableCell>{d.creator?.full_name || d.creator?.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'approved' ? 'default' : 'outline'}>
                      {d.status || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/documents/markup/${d.id}`}
                      className="underline text-blue-600"
                    >
                      열기
                    </Link>
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
