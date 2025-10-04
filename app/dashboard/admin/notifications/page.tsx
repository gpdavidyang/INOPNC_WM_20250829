import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import NotificationsTable from '@/components/admin/NotificationsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'

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

  // Compute initial star map from latest engagement (admin_starred/unstarred)
  let initialStars: Record<string, boolean> = {}
  try {
    const ids = logs.map((n: any) => n.id).filter(Boolean)
    if (ids.length > 0) {
      const { data: engagements } = await supabase
        .from('notification_engagement')
        .select('notification_id, engagement_type, engaged_at')
        .in('notification_id', ids)
        .in('engagement_type', ['admin_starred', 'admin_unstarred'])
        .order('engaged_at', { ascending: false })

      const map = new Map<string, boolean>()
      for (const e of engagements || []) {
        const id = (e as any).notification_id
        if (map.has(id)) continue
        const type = String((e as any).engagement_type || '')
        map.set(id, type === 'admin_starred')
      }
      initialStars = Object.fromEntries(Array.from(map.entries()))
    }
  } catch {
    initialStars = {}
  }

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
              <Input name="search" defaultValue={search} placeholder={t('common.search')} />
              <Button type="submit" variant="outline">
                {t('common.search')}
              </Button>
            </form>
          </div>
          <NotificationsTable logs={logs} initialStars={initialStars} />
        </CardContent>
      </Card>
    </div>
  )
}
