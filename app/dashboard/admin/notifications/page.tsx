import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
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
  title: '알림 센터',
}

export default async function NotificationCenterPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const supabase = createClient()

  const search = ((searchParams?.search as string) || '').trim()

  // Count with optional filter
  let countQuery = supabase.from('notification_logs').select('id', { count: 'exact', head: true })
  if (search) {
    countQuery = countQuery.or(
      `title.ilike.%${search}%,body.ilike.%${search}%,notification_type.ilike.%${search}%`
    )
  }
  const { count: totalLogs } = await countQuery

  // Data with same filter
  let dataQuery = supabase
    .from('notification_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(20)
  if (search) {
    dataQuery = dataQuery.or(
      `title.ilike.%${search}%,body.ilike.%${search}%,notification_type.ilike.%${search}%`
    )
  }
  const { data } = await dataQuery
  const logs = Array.isArray(data) ? data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>알림 총수</CardTitle>
            <CardDescription>notification_logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalLogs ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 알림 이력</CardTitle>
          <CardDescription>최신 20개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <form method="GET" className="flex items-center gap-2">
              <Input name="search" defaultValue={search} placeholder="제목/내용/유형 검색" />
              <Button type="submit" variant="outline">
                검색
              </Button>
            </form>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>대상</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      표시할 알림이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((n: any) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        {n.sent_at ? new Date(n.sent_at).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>{n.notification_type || '-'}</TableCell>
                      <TableCell className="truncate max-w-[320px]" title={n.title || n.body || ''}>
                        {n.title || n.body || '-'}
                      </TableCell>
                      <TableCell>{n.status || '-'}</TableCell>
                      <TableCell className="truncate max-w-[220px]" title={n.user_id || ''}>
                        {n.user_id || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
