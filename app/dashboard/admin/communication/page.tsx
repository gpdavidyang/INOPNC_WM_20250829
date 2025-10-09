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
  const startDate = (searchParams?.startDate as string) || ''
  const endDate = (searchParams?.endDate as string) || ''
  const filterType = (searchParams?.type as string) || ''
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

  // 분석 메트릭 — analytics 탭에서만 조회
  let metrics: any = null
  if (tab === 'analytics') {
    const q = new URLSearchParams()
    if (startDate) q.set('startDate', startDate)
    if (endDate) q.set('endDate', endDate)
    if (filterType) q.set('type', filterType)
    const metricsRes = await fetch(
      `${baseUrl}/api/notifications/analytics/metrics${q.toString() ? `?${q}` : ''}`,
      { cache: 'no-store' }
    ).catch(() => null)
    metrics = (await metricsRes?.json().catch(() => null)) || null
  }

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
            {
              key: 'analytics',
              label: '분석',
              href: '/dashboard/admin/communication?tab=analytics',
            },
            {
              key: 'settings',
              label: '템플릿/설정',
              href: '/dashboard/admin/communication?tab=settings',
            },
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

        {tab === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기간/필터</CardTitle>
                <CardDescription>분석 범위를 설정합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                  <input type="hidden" name="tab" value="analytics" />
                  <div className="col-span-1">
                    <label className="block text-xs text-muted-foreground mb-1">시작일</label>
                    <Input type="datetime-local" name="startDate" defaultValue={startDate} />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-muted-foreground mb-1">종료일</label>
                    <Input type="datetime-local" name="endDate" defaultValue={endDate} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">알림 타입</label>
                    <Input
                      name="type"
                      defaultValue={filterType}
                      placeholder="예: site_announcement"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button type="submit" variant="outline">
                      조회
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>요약 지표</CardTitle>
                <CardDescription>전송/성공/클릭/참여율</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.summary ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <Stat label="전송" value={metrics.summary.totalSent} />
                    <Stat label="성공" value={metrics.summary.delivered} />
                    <Stat label="실패" value={metrics.summary.failed} />
                    <Stat label="클릭" value={metrics.summary.clicked} />
                    <Stat label="전달율(%)" value={metrics.summary.deliveryRate} />
                    <Stat label="클릭율(%)" value={metrics.summary.clickRate} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">지표를 불러올 수 없습니다.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>타입별 지표</CardTitle>
                <CardDescription>알림 타입별 전송/성공/실패/클릭율</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.byType ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-4">타입</th>
                          <th className="py-2 pr-4">전송</th>
                          <th className="py-2 pr-4">성공</th>
                          <th className="py-2 pr-4">실패</th>
                          <th className="py-2 pr-4">클릭율(%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(metrics.byType).map(([type, row]: any) => (
                          <tr key={type} className="border-b last:border-b-0">
                            <td className="py-2 pr-4 font-medium">{type || '-'}</td>
                            <td className="py-2 pr-4">{row.sent}</td>
                            <td className="py-2 pr-4">{row.delivered}</td>
                            <td className="py-2 pr-4">{row.failed}</td>
                            <td className="py-2 pr-4">{row.clickRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">타입별 지표가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 7일 추이</CardTitle>
                <CardDescription>일자별 전송/성공/클릭</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.timeSeries ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-4">날짜</th>
                          <th className="py-2 pr-4">전송</th>
                          <th className="py-2 pr-4">성공</th>
                          <th className="py-2 pr-4">클릭</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.timeSeries.map((d: any) => (
                          <tr key={d.date} className="border-b last:border-b-0">
                            <td className="py-2 pr-4 font-medium">{d.date}</td>
                            <td className="py-2 pr-4">{d.sent}</td>
                            <td className="py-2 pr-4">{d.delivered}</td>
                            <td className="py-2 pr-4">{d.clicked}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">추이 데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'settings' && <SettingsTemplatesSection />}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{String(value ?? 0)}</div>
    </div>
  )
}

async function SettingsTemplatesSection() {
  // 서버 컴포넌트: 템플릿 목록 시도 로드 (존재하지 않으면 빈 목록)
  const supabase = createClient()
  let templates: any[] = []
  try {
    const { data } = await supabase
      .from('notification_templates')
      .select('id,name,channel,category,is_active,updated_at')
      .order('updated_at', { ascending: false })
      .limit(20)
    templates = Array.isArray(data) ? data : []
  } catch (_) {
    templates = []
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>템플릿 라이브러리</CardTitle>
          <CardDescription>알림/푸시 템플릿(있을 경우) 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">이름</th>
                    <th className="py-2 pr-4">채널</th>
                    <th className="py-2 pr-4">카테고리</th>
                    <th className="py-2 pr-4">상태</th>
                    <th className="py-2 pr-4">업데이트</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t: any) => (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium">{t.name}</td>
                      <td className="py-2 pr-4">{t.channel}</td>
                      <td className="py-2 pr-4">{t.category || '-'}</td>
                      <td className="py-2 pr-4">{t.is_active ? '활성' : '비활성'}</td>
                      <td className="py-2 pr-4">
                        {t.updated_at ? new Date(t.updated_at).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              템플릿 데이터가 없거나 테이블이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>정책/설정</CardTitle>
          <CardDescription>조용한 시간, 레이트 리밋, 채널 기본값</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>푸시 조용한 시간(quiet hours): 사용자별 preferences(JSON)로 적용됨</li>
            <li>시간당 최대 알림: 기본 10건(사용자 preferences에 따라 조정)</li>
            <li>긴급 알림(critical/high)은 조용한 시간 일부 무시</li>
            <li>채널/타입별 수신 설정: 향후 전역 기본값 + 사용자 오버라이드 UI 제공 예정</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
