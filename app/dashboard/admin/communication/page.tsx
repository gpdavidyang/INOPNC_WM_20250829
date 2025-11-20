import type { Metadata } from 'next'
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
import { AdminAuditTimeline } from '@/components/admin/communication/AdminAuditTimeline'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '커뮤니케이션' }

export default async function CommunicationManagementPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const supabase = createClient()

  const tab = (searchParams?.tab as string) || 'compose'
  const search = ((searchParams?.search as string) || '').trim()
  const roleFilter = ((searchParams?.role as string) || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  // 공지 목록 (탭 무관: 상단 지표에 사용)
  let announcements: any[] = []
  let announcementStats = { total: 0, active: 0 }
  {
    let announcementsQuery = supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      const filterValue = search.replace(/'/g, "''")
      announcementsQuery = announcementsQuery.or(
        `title.ilike.%${filterValue}%,content.ilike.%${filterValue}%`
      )
    }

    const { data, error, count } = await announcementsQuery

    if (!error && Array.isArray(data)) {
      announcements = data
      const active = data.filter(a => a?.is_active).length
      announcementStats = {
        total: Number.isFinite(count) ? (count ?? data.length) : data.length,
        active,
      }
    }
  }

  // 알림 로그(전달 로그) — logs 탭에서만 조회
  let logs: any[] = []
  let totalLogs = 0
  let initialStars: Record<string, boolean> = {}
  let auditEvents: any[] = []
  if (tab === 'logs') {
    const logsQs = new URLSearchParams()
    logsQs.set('mode', 'logs')
    logsQs.set('page', '1')
    logsQs.set('pageSize', '20')
    if (search) logsQs.set('search', search)
    if (roleFilter) logsQs.set('targetRole', roleFilter)
    const logsRes = await fetch(
      `${baseUrl}/api/admin/communication/overview?${logsQs.toString()}`,
      { cache: 'no-store' }
    ).catch(() => null)
    const logsJson = await logsRes?.json().catch(() => null)
    logs = Array.isArray(logsJson?.logs) ? logsJson.logs : []
    totalLogs = logsJson?.total ?? logs.length
    initialStars = logsJson?.initialStars || {}

    if (!logs.length) {
      const siteMap: Record<string, string> = {}
      const { data: siteRows } = await supabase.from('sites').select('id, name')
      siteRows?.forEach(site => {
        if (site?.id) siteMap[site.id] = site?.name || site.id
      })
      let fallbackQuery = supabase
        .from('announcements')
        .select(
          `
          id,
          title,
          content,
          target_roles,
          target_sites,
          created_at
        `
        )
        .order('created_at', { ascending: false })
        .limit(50)
      if (search) {
        const filterValue = search.replace(/'/g, "''")
        fallbackQuery = fallbackQuery.or(
          `title.ilike.%${filterValue}%,content.ilike.%${filterValue}%`
        )
      }
      if (roleFilter) {
        fallbackQuery = fallbackQuery.contains('target_roles', [roleFilter])
      }
      const { data: announcementRows } = await fallbackQuery
      logs =
        announcementRows?.map(row => {
          const siteId = row.target_sites?.[0] || null
          return {
            id: row.id,
            notification_type: 'site_announcement',
            title: row.title || '공지',
            body: row.content || '',
            status: 'pending',
            sent_at: row.created_at,
            user_id: null,
            target_role: row.target_roles?.[0] || '',
            target_site_id: siteId,
            target_partner_company_id: null,
            target_site_name: siteId ? siteMap[siteId] || siteId : null,
            target_partner_company_name: null,
            announcement_id: row.id,
            announcement_title: row.title || '공지',
            dispatch_id: null,
            dispatch_batch_id: null,
            starred: false,
            has_delivery_log: false,
            dispatch_status: 'pending',
          }
        }) || []
      totalLogs = logs.length
      initialStars = {}
    }

    const auditRes = await fetch(`${baseUrl}/api/admin/communication/engagement`, {
      cache: 'no-store',
    }).catch(() => null)
    const auditJson = await auditRes?.json().catch(() => null)
    auditEvents = Array.isArray(auditJson?.events) ? auditJson.events : []
  }

  // 분석/설정 탭 제거됨

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="커뮤니케이션"
        description="공지 작성과 전달 로그를 통합 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '커뮤니케이션' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 상단 지표 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">활성 공지</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {announcementStats.active}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">총 공지</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{announcementStats.total}</p>
          </div>
          {tab === 'logs' && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">알림 총수</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalLogs}</p>
            </div>
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
                <form method="GET" className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="tab" value="announcements" />
                  {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
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
              <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-3 text-xs text-muted-foreground mb-3 space-y-1">
                <p>
                  <strong className="text-foreground">전달 로그</strong>는 공지나 자동 알림이 실제
                  사용자에게 언제 전달됐는지 기록한 목록입니다.
                </p>
                <ul className="list-disc pl-4">
                  <li>
                    <strong>상태가 대기</strong>로 표시되면 아직 발송 결과가 기록되지 않은 초기
                    상태입니다. 잠시 후 전달 완료/읽음 등으로 바뀝니다.
                  </li>
                  <li>
                    <strong>동작이 대기 중</strong>이면 개별 로그 ID가 아직 없어 읽음/확인/반려
                    버튼을 사용할 수 없다는 뜻입니다.
                  </li>
                  <li>
                    실제 알림은 작업자·현장관리자의 앱 알림 센터에서 확인하며, 이 탭은 관리자용 전달
                    현황 모니터링 화면입니다.
                  </li>
                </ul>
              </div>
              <div className="mb-3">
                <form method="GET" className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="tab" value="logs" />
                  <div className="flex flex-col">
                    <label htmlFor="log-role" className="text-xs text-muted-foreground">
                      대상 역할
                    </label>
                    <select
                      id="log-role"
                      name="role"
                      defaultValue={roleFilter}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="worker">작업자</option>
                      <option value="site_manager">현장관리자</option>
                      <option value="customer_manager">파트너</option>
                      <option value="admin">본사관리자</option>
                    </select>
                  </div>
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
                <p className="mt-2 text-xs text-muted-foreground">
                  검색어와 역할 필터는 주소창에 저장되어 새로고침하거나 다시 방문해도 유지됩니다.
                </p>
              </div>
              <NotificationsTable logs={logs} initialStars={initialStars} />
            </CardContent>
          </Card>
        )}
        {tab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>감사 로그</CardTitle>
              <CardDescription>상태 변경 및 즐겨찾기 활동</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminAuditTimeline events={auditEvents} />
            </CardContent>
          </Card>
        )}
        {/* analytics/settings 탭 제거됨 */}
      </div>
    </div>
  )
}
