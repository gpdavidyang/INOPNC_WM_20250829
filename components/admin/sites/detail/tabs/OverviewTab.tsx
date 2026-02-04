'use client'

import DailyReportsTable from '@/components/admin/DailyReportsTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { AssignmentsTable } from '../AssignmentsTable'

const SITE_STATUS_LABELS: Record<string, string> = {
  planning: '준비 중',
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}

const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  general_contractor: '원청',
  subcontractor: '협력사',
  supplier: '자재업체',
  partner: '파트너',
}

const ROLE_KO: Record<string, string> = {
  worker: '작업자',
  site_manager: '현장관리자',
  supervisor: '감리/감독',
  admin: '본사관리자',
  system_admin: '시스템 관리자',
}

interface OverviewTabProps {
  siteId: string
  site: any
  organization: any
  stats: any
  statsLoading: boolean
  recentReports: any[]
  reportsLoading: boolean
  recentAssignments: any[]
  assignmentsLoading: boolean
  recentRequests: any[]
  requestsLoading: boolean
  availableCount: number | null
  laborByUser: Record<string, number>
  globalLaborByUser: Record<string, number>
  invoiceStageSummary: any
  onTabChange: (tab: string) => void
  assignmentQuery: string
  setAssignmentQuery: (q: string) => void
  assignmentRole: string
  setAssignmentRole: (r: any) => void
  assignmentSort: string
  setAssignmentSort: (s: any) => void
  filteredAndSortedAssignments: any
}

export function OverviewTab({
  siteId,
  site,
  organization,
  stats,
  statsLoading,
  recentReports,
  reportsLoading,
  recentAssignments,
  assignmentsLoading,
  recentRequests,
  requestsLoading,
  availableCount,
  laborByUser,
  globalLaborByUser,
  invoiceStageSummary,
  onTabChange,
  assignmentQuery,
  setAssignmentQuery,
  assignmentRole,
  setAssignmentRole,
  assignmentSort,
  setAssignmentSort,
  filteredAndSortedAssignments,
}: OverviewTabProps) {
  const formatLabor = (val: number) => (val || 0).toFixed(1)

  return (
    <div className="mt-4 space-y-8">
      {/* Site Info Grid */}
      <div className="grid gap-6 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
          <h4 className="font-bold text-foreground">기본 정보</h4>
          <div className="grid grid-cols-2 gap-y-3">
            <div>
              <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                현장 상태
              </div>
              <Badge variant={site?.status === 'active' ? 'default' : 'outline'}>
                {site?.status ? SITE_STATUS_LABELS[String(site.status)] || '미정' : '-'}
              </Badge>
            </div>
            <div>
              <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                공사 기간
              </div>
              <div className="font-medium text-foreground">
                {site?.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'} ~{' '}
                {site?.end_date ? new Date(site.end_date).toLocaleDateString('ko-KR') : 'TBD'}
              </div>
            </div>
            <div className="col-span-2 border-t pt-3 mt-1">
              <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                현장 주소
              </div>
              <div className="font-medium text-foreground">{site?.address || '-'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
          <h4 className="font-bold text-foreground">담당자 정보</h4>
          <div className="grid grid-cols-2 gap-y-3">
            <div>
              <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                현장 관리자
              </div>
              <div className="font-medium text-foreground">{site?.manager_name || '-'}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                관리자 연락처
              </div>
              <div className="font-medium text-foreground">{site?.manager_phone || '-'}</div>
            </div>
            <div className="col-span-2 border-t pt-3 mt-1">
              <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                안전 관리자
              </div>
              <div className="font-medium text-foreground">{site?.safety_manager_name || '-'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
          <h4 className="font-bold text-foreground">통계 요약</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl">
              <div className="text-[11px] uppercase font-black tracking-tighter text-blue-600">
                작업일지
              </div>
              <div className="text-2xl font-black text-blue-700 italic">
                {statsLoading ? '...' : (stats?.reports ?? 0)}
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl">
              <div className="text-[11px] uppercase font-black tracking-tighter text-amber-600">
                총공수(승인)
              </div>
              <div className="text-2xl font-black text-amber-700 italic">
                {statsLoading ? '...' : formatLabor(stats?.labor)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Section */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-foreground">소속(시공사) 정보</h3>
            <p className="text-xs text-muted-foreground">
              현장에 연동된 시공업체의 상세 정보입니다.
            </p>
          </div>
          {organization?.id && (
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <a href={`/dashboard/admin/organizations/${organization.id}`}>시공사 상세 보기</a>
            </Button>
          )}
        </div>
        {organization ? (
          <dl className="grid gap-6 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                소속명
              </dt>
              <dd className="text-base font-bold text-foreground">{organization.name}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[11px] uppercase font-black tracking-tighter opacity-50">구분</dt>
              <dd className="text-base font-bold text-foreground">
                {ORGANIZATION_TYPE_LABELS[organization.type] || organization.type}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                연락처
              </dt>
              <dd className="text-base font-bold text-foreground">
                {organization.contact_phone || organization.phone || '-'}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[11px] uppercase font-black tracking-tighter opacity-50">
                이메일
              </dt>
              <dd className="text-base font-bold text-foreground">
                {organization.contact_email || organization.email || '-'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border-2 border-dashed">
            연결된 시공사 정보가 없습니다.
          </p>
        )}
      </section>

      {/* Invoice Progress */}
      {invoiceStageSummary && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-foreground">기성 문서 진행도</h3>
              <p className="text-xs text-muted-foreground">단계별 필수 문서 등록 현황</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => onTabChange('invoices')}
            >
              관리 페이지로 이동
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {invoiceStageSummary.items.map((item: any) => (
              <div
                key={item.key}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest">{item.key}</span>
                  <span className="text-xs font-bold text-blue-600">
                    {item.fulfilled}/{item.required}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-1000"
                    style={{ width: `${item.ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reports Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">최근 작업일지</h3>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <a href={`/dashboard/admin/daily-reports?site_id=${siteId}`}>전체보기</a>
          </Button>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm overflow-hidden">
          {reportsLoading && recentReports.length === 0 ? (
            <TableSkeleton rows={5} />
          ) : (
            <DailyReportsTable reports={recentReports} />
          )}
        </div>
      </section>

      {/* Assignments Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">배정 인원</h3>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <a href={`/dashboard/admin/sites/${siteId}/assign`}>사용자 배정</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => onTabChange('assignments')}
            >
              전체보기
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          {/* Quick Filter */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
                검색
              </span>
              <Input
                value={assignmentQuery}
                onChange={e => setAssignmentQuery(e.target.value)}
                placeholder="검색..."
                className="h-10 w-48 rounded-xl bg-gray-50 border-none px-4 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
                역할
              </span>
              <CustomSelect value={assignmentRole} onValueChange={v => setAssignmentRole(v)}>
                <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm w-32">
                  <CustomSelectValue placeholder="역할" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 역할</CustomSelectItem>
                  <CustomSelectItem value="worker">작업자</CustomSelectItem>
                  <CustomSelectItem value="site_manager">현장관리자</CustomSelectItem>
                  <CustomSelectItem value="supervisor">감리/감독</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
                정렬
              </span>
              <CustomSelect value={assignmentSort} onValueChange={v => setAssignmentSort(v)}>
                <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm w-32">
                  <CustomSelectValue placeholder="정렬" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="date_desc">최신순</CustomSelectItem>
                  <CustomSelectItem value="date_asc">오래된순</CustomSelectItem>
                  <CustomSelectItem value="name_asc">이름순</CustomSelectItem>
                  <CustomSelectItem value="labor_desc">공수순</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
          </div>

          {assignmentsLoading && recentAssignments.length === 0 ? (
            <TableSkeleton rows={5} />
          ) : (
            <AssignmentsTable
              siteId={siteId}
              data={filteredAndSortedAssignments(
                recentAssignments,
                laborByUser,
                assignmentQuery,
                assignmentSort,
                assignmentRole
              )}
              laborByUser={laborByUser}
              globalLaborByUser={globalLaborByUser}
            />
          )}
        </div>
      </section>
    </div>
  )
}
