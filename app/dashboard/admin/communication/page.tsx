import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import AnnounceTable from '@/components/admin/AnnounceTable'
import NotificationsTable from '@/components/admin/NotificationsTable'
import { AdminAuditTimeline } from '@/components/admin/communication/AdminAuditTimeline'
import AnnouncementCreateForm from '@/components/admin/communication/AnnouncementCreateForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import PillTabLinks from '@/components/ui/pill-tab-links'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Info, Search } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '공지사항 관리' }

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
  let siteNameMap: Record<string, string> = {}
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
      const siteIds = Array.from(
        new Set(
          data.flatMap(row =>
            Array.isArray(row?.target_sites)
              ? (row.target_sites as string[]).filter(site => typeof site === 'string')
              : []
          )
        )
      )
      if (siteIds.length) {
        const { data: siteRows } = await supabase.from('sites').select('id, name').in('id', siteIds)
        siteRows?.forEach(site => {
          if (site?.id) siteNameMap[site.id] = site?.name || site.id
        })
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

  // analytics/settings 탭 제거됨
  const isLogsTab = tab === 'logs'
  const isAnnouncementsTab = tab === 'announcements'
  const isComposeTab = tab === 'compose'

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="공지사항 관리"
        description="전사 공지사항 작성 및 자동 알림 발송 이력을 통합 관리합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '공지사항 관리' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. Stats Grid (v1.66 Silent Efficiency) */}
        {(() => {
          const stats = [
            {
              label: '활성 운영 공지',
              value: announcementStats.active,
              unit: '건',
              bg: 'bg-emerald-50/50',
              text: 'text-emerald-600',
            },
            {
              label: '누적 등록 공지',
              value: announcementStats.total,
              unit: '건',
              bg: 'bg-indigo-50/50',
              text: 'text-indigo-600',
            },
            ...(isLogsTab
              ? [
                  {
                    label: '알림 발송 총수',
                    value: totalLogs,
                    unit: '건',
                    bg: 'bg-blue-50/50',
                    text: 'text-blue-600',
                  },
                ]
              : []),
          ]
          const gridCols =
            stats.length === 2
              ? 'sm:grid-cols-2'
              : stats.length === 3
                ? 'sm:grid-cols-3'
                : 'sm:grid-cols-2 lg:grid-cols-4'

          return (
            <div className={cn('grid grid-cols-1 gap-4', gridCols)}>
              {stats.map((stat, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    'rounded-2xl border-none shadow-sm shadow-gray-200/40 overflow-hidden',
                    stat.bg
                  )}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className={cn('text-2xl font-black tracking-tight', stat.text)}>
                        {stat.value.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        })()}

        {/* 2. Navigation Hub */}
        <div className="w-full">
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
        </div>

        {/* 3. Tab Contents */}
        {isComposeTab && (
          <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
              <CardTitle className="text-lg font-bold text-[#1A254F]">새 공지사항 작성</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-400">
                필수 항목을 입력하여 전사 또는 특정 현장에 공지사항을 발행합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-10">
              <AnnouncementCreateForm />
            </CardContent>
          </Card>
        )}

        {isAnnouncementsTab && (
          <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
              <CardTitle className="text-lg font-bold text-[#1A254F]">발행 공지 목록</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-400">
                현재 시스템에 등록되어 노출 중인 공지사항 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <form method="GET" className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="tab" value="announcements" />
                  {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      name="search"
                      defaultValue={search}
                      placeholder="제목 또는 내용으로 검색..."
                      className="w-64 md:w-80 h-10 rounded-xl bg-white border-slate-200 pl-10 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white px-6 font-bold text-sm shadow-sm transition-all"
                  >
                    검색
                  </Button>
                </form>
              </div>
              <div className="p-0">
                <AnnounceTable announcements={announcements} siteNameMap={siteNameMap} />
              </div>
            </CardContent>
          </Card>
        )}

        {isLogsTab && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
                <CardTitle className="text-lg font-bold text-[#1A254F]">알림 전달 로그</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-400">
                  사용자 기기로 발송된 개별 알림의 수신 현황을 모니터링합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 bg-amber-50/40 border-b border-amber-100 flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-xl mt-0.5">
                    <Info className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900 leading-relaxed">
                      시스템 발송 현행화 안내
                    </p>
                    <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                      발송 직후에는 상태가 &apos;대기&apos;로 표시될 수 있으며, 실제 전달 여부는
                      서비스 제공자의 발송 결과 피드백에 따라 수 초 내에 업데이트됩니다.
                    </p>
                  </div>
                </div>

                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <form method="GET" className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="tab" value="logs" />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                        대상 역할
                      </label>
                      <select
                        name="role"
                        defaultValue={roleFilter}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none min-w-[140px]"
                      >
                        <option value="">전체 역할</option>
                        <option value="worker">작업자</option>
                        <option value="site_manager">현장관리자</option>
                        <option value="customer_manager">파트너</option>
                        <option value="admin">본사관리자</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-grow">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                        검색어
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          name="search"
                          defaultValue={search}
                          placeholder="공지 제목 또는 수신자 검색..."
                          className="h-10 rounded-xl bg-white border-slate-200 pl-10 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="h-10 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white px-8 font-bold text-sm shadow-sm transition-all mb-[1px]"
                    >
                      조회하기
                    </Button>
                  </form>
                </div>

                <div className="p-0">
                  <NotificationsTable logs={logs} initialStars={initialStars} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
                <CardTitle className="text-lg font-bold text-[#1A254F]">
                  감사 기록 (Audit Logs)
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-400">
                  공지 관리 및 알림 관련 주요 활동 이력입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AdminAuditTimeline events={auditEvents} />
              </CardContent>
            </Card>
          </div>
        )}
        {/* analytics/settings 탭 제거됨 */}
      </div>
    </div>
  )
}
