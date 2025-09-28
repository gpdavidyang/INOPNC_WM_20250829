import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getAuditLogs } from '@/app/actions/admin/system'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

export const metadata: Metadata = {
  title: '감사 로그',
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  // Parse filters from URL
  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(50, Math.max(10, limitRaw))
  const search = ((searchParams?.search as string) || '').trim()
  const action = ((searchParams?.action as string) || '').trim()
  const table = ((searchParams?.table as string) || '').trim()
  const date_from = ((searchParams?.date_from as string) || '').trim() || undefined
  const date_to = ((searchParams?.date_to as string) || '').trim() || undefined

  const result = await getAuditLogs(
    page,
    limit,
    search,
    action || undefined,
    table || undefined,
    date_from,
    date_to
  )
  const logs = result.success && result.data ? (result.data.logs as any[]) : []
  const total = result.success && result.data ? result.data.total : 0
  const pages = result.success && result.data ? Math.max(1, result.data.pages) : 1

  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (action) params.set('action', action)
    if (table) params.set('table', table)
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    params.set('limit', String(limit))
    params.set('page', String(nextPage))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">감사 로그</h1>
        <p className="text-sm text-muted-foreground">최근 활동 내역을 읽기 전용으로 표시합니다.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>필터</CardTitle>
          <CardDescription>검색어, 작업, 테이블, 기간을 지정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="GET"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
          >
            <input type="hidden" name="page" value="1" />
            <div className="lg:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">검색어</label>
              <Input name="search" defaultValue={search} placeholder="action, table 등" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">작업</label>
              <Input name="action" defaultValue={action} placeholder="예: UPDATE" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">테이블</label>
              <Input name="table" defaultValue={table} placeholder="예: documents" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">시작일</label>
              <Input type="date" name="date_from" defaultValue={date_from} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">종료일</label>
              <Input type="date" name="date_to" defaultValue={date_to} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">페이지 크기</label>
              <select
                name="limit"
                defaultValue={String(limit)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                href="/dashboard/admin/audit-logs"
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
              >
                초기화
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 감사 이벤트</CardTitle>
          <CardDescription>
            총 {total}건 · 페이지 {page} / {pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>작업</TableHead>
                  <TableHead>테이블</TableHead>
                  <TableHead>레코드 ID</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      표시할 감사 로그가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.timestamp).toLocaleString('ko-KR')}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell className="truncate max-w-[200px]" title={log.record_id || ''}>
                        {log.record_id || '-'}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <span className="truncate max-w-[240px] inline-block">
                            {log.user.full_name || log.user.email || '-'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{log.ip_address || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {total}건 중 {(page - 1) * limit + 1}–{Math.min(page * limit, total)} 표시
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
        </CardContent>
      </Card>
    </div>
  )
}
