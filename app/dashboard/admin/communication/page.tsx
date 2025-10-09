import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import AnnounceTable from '@/components/admin/AnnounceTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import AnnouncementCreateForm from '@/components/admin/communication/AnnouncementCreateForm'
import PillTabLinks from '@/components/ui/pill-tab-links'
import NotificationsTable from '@/components/admin/NotificationsTable'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '커뮤니케이션 센터' }

export default async function CommunicationManagementPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const tab = (searchParams?.tab as string) || 'compose'
  const search = ((searchParams?.search as string) || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  // 공지 목록 (탭 무관: 상단 지표에 사용)
  const qs = new URLSearchParams()
  if (search) qs.set('search', search)
  const announcementsRes = await fetch(
    `${baseUrl}/api/announcements${qs.toString() ? `?${qs}` : ''}`,
    { cache: 'no-store' }
  ).catch(() => null)
  const announcementsJson = await announcementsRes?.json().catch(() => null)
  const announcements: any[] = announcementsJson?.announcements || []

  // 알림 로그(전달 로그) — logs 탭에서만 조회
  let logs: any[] = []
  let totalLogs = 0
  let initialStars: Record<string, boolean> = {}
  if (tab === 'logs') {
    const supabase = createClient()

    // Count with optional filter
    let countQuery = supabase.from('notification_logs').select('id', { count: 'exact', head: true })
    if (search) {
      countQuery = countQuery.or(
        `title.ilike.%${search}%,body.ilike.%${search}%,notification_type.ilike.%${search}%`
      )
    }
    const { count } = await countQuery
    totalLogs = count || 0

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
    logs = Array.isArray(data) ? data : []

    // Compute star map from latest engagement
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
  }

  // 분석/설정 탭 제거됨

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="커뮤니케이션 센터"
        description="공지 작성, 전달 로그, 분석을 통합 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '커뮤니케이션' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 상단 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>활성 공지</CardTitle>
              <CardDescription>현재 게시 중</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {announcements.filter(a => a.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>총 공지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{announcements.length}</div>
            </CardContent>
          </Card>
          {tab === 'logs' && (
            <Card>
              <CardHeader>
                <CardTitle>알림 총수</CardTitle>
                <CardDescription>notification_logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totalLogs}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 탭 내비게이션: 네이비(브랜드) 스타일 Pill Tabs */}
        <PillTabLinks
          activeKey={tab}
          items={[
            {
              key: 'compose',
              label: '공지 작성',
              href: '/dashboard/admin/communication?tab=compose',
            },
            {
              key: 'announcements',
              label: '공지 목록',
              href: '/dashboard/admin/communication?tab=announcements',
            },
            { key: 'logs', label: '전달 로그', href: '/dashboard/admin/communication?tab=logs' },
          ]}
          className="w-full"
          fill
        />

        {/* 탭 콘텐츠 */}
        {tab === 'compose' && (
          <Card>
            <CardHeader>
              <CardTitle>공지 작성</CardTitle>
              <CardDescription>필수 필드만 입력하여 공지를 생성합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementCreateForm />
            </CardContent>
          </Card>
        )}

        {tab === 'announcements' && (
          <Card>
            <CardHeader>
              <CardTitle>공지사항</CardTitle>
              <CardDescription>역할/현장 조건에 따라 노출되는 관리자 공지</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <form method="GET" className="flex items-center gap-2 flex-nowrap">
                  <input type="hidden" name="tab" value="announcements" />
                  <Input
                    name="search"
                    defaultValue={search}
                    placeholder={t('common.search')}
                    className="w-64 md:w-80"
                  />
                  <Button type="submit" variant="outline">
                    {t('common.search')}
                  </Button>
                </form>
              </div>
              <AnnounceTable announcements={announcements} />
            </CardContent>
          </Card>
        )}

        {tab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>최근 알림 이력</CardTitle>
              <CardDescription>최신 20개</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <form method="GET" className="flex items-center gap-2 flex-nowrap">
                  <input type="hidden" name="tab" value="logs" />
                  <Input
                    name="search"
                    defaultValue={search}
                    placeholder={t('common.search')}
                    className="w-64 md:w-80"
                  />
                  <Button type="submit" variant="outline">
                    {t('common.search')}
                  </Button>
                </form>
              </div>
              <NotificationsTable logs={logs} initialStars={initialStars} />
            </CardContent>
          </Card>
        )}
        {/* analytics/settings 탭 제거됨 */}
      </div>
    </div>
  )
}
