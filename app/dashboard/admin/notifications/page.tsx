import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import NotificationsTable from '@/components/admin/NotificationsTable'
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
          <NotificationsTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
