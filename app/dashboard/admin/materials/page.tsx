import type { Metadata } from 'next'
import Link from 'next/link'
import PillTabLinks from '@/components/ui/pill-tab-links'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StatsCard from '@/components/ui/stats-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import ShipmentsTable from '@/components/admin/materials/ShipmentsTable'
import EmptyState from '@/components/ui/empty-state'
import {
  getMaterialRequests,
  getMaterialShipments,
  getMaterialProductions,
  getNPC1000Summary,
  getNPC1000BySite,
} from '@/app/actions/admin/materials'

export const metadata: Metadata = {
  title: '자재 관리',
}

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const tab = ((searchParams?.tab as string) || 'inventory') as
    | 'inventory' // 현장별 재고현황 (NPC-1000)
    | 'requests' // 입고요청 관리
    | 'productions' // 생산정보 관리
    | 'shipments' // 출고배송 관리
  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  // 페이지 크기 고정: 100
  const limit = 100
  const search = ((searchParams?.search as string) || '').trim()
  // 상태 개념 미사용(승인/반려 제거)
  const site_id = ((searchParams?.site_id as string) || '').trim()
  const status = ((searchParams?.status as string) || '').trim() as
    | ''
    | 'pending'
    | 'approved'
    | 'ordered'
    | 'delivered'
    | 'cancelled'
  const date_from = ((searchParams?.date_from as string) || '').trim() || undefined
  const date_to = ((searchParams?.date_to as string) || '').trim() || undefined

  let requests: any[] = []
  let shipments: any[] = []
  let productions: any[] = []
  let npcSummary: any | null = null
  let npcSites: any[] = []
  let total = 0
  let pages = 1

  if (tab === 'inventory') {
    const [sumRes, siteRes] = await Promise.all([
      getNPC1000Summary(),
      getNPC1000BySite(page, limit, search || undefined),
    ])
    npcSummary = sumRes.success ? (sumRes.data as any) : null
    npcSites = siteRes.success && siteRes.data ? (siteRes.data as any).sites : []
    total = siteRes.success && siteRes.data ? (siteRes.data as any).total : 0
    pages = siteRes.success && siteRes.data ? (siteRes.data as any).pages : 1
  } else if (tab === 'requests') {
    const res = await getMaterialRequests(
      page,
      limit,
      search,
      (status || undefined) as any,
      site_id || undefined
    )
    requests = res.success && res.data ? (res.data as any).requests : []
    total = res.success && res.data ? (res.data as any).total : 0
    pages = res.success && res.data ? (res.data as any).pages : 1
  } else if (tab === 'productions') {
    const res = await getMaterialProductions(
      page,
      limit,
      site_id || undefined,
      undefined,
      date_from,
      date_to
    )
    productions = res.success && res.data ? (res.data as any).productions : []
    total = res.success && res.data ? (res.data as any).total : 0
    pages = res.success && res.data ? (res.data as any).pages : 1
  } else if (tab === 'shipments') {
    const res = await getMaterialShipments(
      page,
      limit,
      site_id || undefined,
      undefined,
      date_from,
      date_to
    )
    shipments = res.success && res.data ? (res.data as any).shipments : []
    total = res.success && res.data ? (res.data as any).total : 0
    pages = res.success && res.data ? (res.data as any).pages : 1
  } else if (tab === 'npc1000') {
    const [sumRes, siteRes] = await Promise.all([
      getNPC1000Summary(),
      getNPC1000BySite(page, limit, search || undefined),
    ])
    npcSummary = sumRes.success ? (sumRes.data as any) : null
    npcSites = siteRes.success && siteRes.data ? (siteRes.data as any).sites : []
    total = siteRes.success && siteRes.data ? (siteRes.data as any).total : 0
    pages = siteRes.success && siteRes.data ? (siteRes.data as any).pages : 1
  }

  const buildQuery = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    if (search) params.set('search', search)
    if (site_id) params.set('site_id', site_id)
    if (status) params.set('status', status)
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    // limit 고정(100) → 쿼리 파라미터로 전달하지 않음
    params.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="자재 관리"
        description="현장별 재고/요청/출고/생산 정보를 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '자재 관리' }]}
        actions={
          <a
            href="/dashboard/admin/materials/settings"
            className={buttonVariants({ variant: 'outline', size: 'standard' })}
            role="button"
          >
            설정
          </a>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs (shared pill-style component) */}
        <div className="mb-4">
          <PillTabLinks
            activeKey={tab}
            items={[
              {
                key: 'inventory',
                label: '현장별 재고현황',
                href: buildQuery({ tab: 'inventory' }),
              },
              { key: 'requests', label: '입고요청 관리', href: buildQuery({ tab: 'requests' }) },
              {
                key: 'productions',
                label: '생산정보 관리',
                href: buildQuery({ tab: 'productions' }),
              },
              {
                key: 'shipments',
                label: '출고·배송·결제 관리',
                href: buildQuery({ tab: 'shipments' }),
              },
            ]}
            fill
            className="w-full"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
          <form
            method="GET"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
          >
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="page" value="1" />
            <div className="lg:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">검색어</label>
              <Input
                name="search"
                defaultValue={search}
                placeholder={
                  tab === 'inventory'
                    ? '현장명'
                    : tab === 'requests'
                      ? '요청번호/메모'
                      : tab === 'productions'
                        ? '생산번호/메모'
                        : '검색어'
                }
              />
            </div>
            {/* 요청 탭: 상태 필터 추가 */}
            {tab === 'requests' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">상태</label>
                <select
                  name="status"
                  defaultValue={status}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  <option value="pending">대기중</option>
                  <option value="approved">승인</option>
                  <option value="ordered">발주</option>
                  <option value="delivered">입고완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>
            )}
            {tab === 'shipments' && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">시작일</label>
                  <Input type="date" name="date_from" defaultValue={date_from} />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">종료일</label>
                  <Input type="date" name="date_to" defaultValue={date_to} />
                </div>
              </>
            )}
            {/* 페이지 크기 고정(100) → 선택 필드 제거 */}
            <div className="lg:col-span-2 flex gap-2">
              <Button type="submit" variant="outline">
                {t('common.apply')}
              </Button>
              <Link
                href={buildQuery({ page: '1', search: '', status: '', site_id: '' })}
                className={buttonVariants({ variant: 'outline', size: 'standard' })}
                role="button"
              >
                {t('common.reset')}
              </Link>
            </div>
          </form>
        </div>

        {/* Tables */}
        {tab === 'inventory' && (
          <div className="space-y-4">
            <div className="mb-2 flex justify-end">
              <a
                className={buttonVariants({ variant: 'outline', size: 'standard' })}
                role="button"
                href={`/api/admin/materials/export?tab=inventory${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              >
                엑셀 다운로드
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard label="현장 수" value={Number(npcSummary?.total_sites ?? 0)} unit="site" />
              <StatsCard label="입고" value={Number(npcSummary?.total_incoming ?? 0)} unit="ea" />
              <StatsCard label="사용" value={Number(npcSummary?.total_used ?? 0)} unit="ea" />
              <StatsCard label="잔여" value={Number(npcSummary?.total_remaining ?? 0)} unit="ea" />
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>현장</TableHead>
                    <TableHead>최근일</TableHead>
                    <TableHead className="text-right">입고</TableHead>
                    <TableHead className="text-right">사용</TableHead>
                    <TableHead className="text-right">잔여</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {npcSites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <EmptyState description="표시할 데이터가 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    npcSites.map((s: any) => (
                      <TableRow key={s.site_id}>
                        <TableCell className="font-medium text-foreground">
                          {s.site_name || '-'}
                        </TableCell>
                        <TableCell>
                          {s.latest_date
                            ? new Date(s.latest_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">{s.incoming ?? 0}</TableCell>
                        <TableCell className="text-right">{s.used ?? 0}</TableCell>
                        <TableCell className="text-right">{s.remaining ?? 0}</TableCell>
                        <TableCell>{s.status || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-4">
            {/* Requests summary cards */}
            {Array.isArray(requests) && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(() => {
                  const totalReq = (requests as any[]).length
                  const count = (st: string) =>
                    (requests as any[]).filter(r => (r.status || '').toLowerCase() === st).length
                  return (
                    <>
                      <StatsCard label="요청건수" value={totalReq} unit="건" />
                      <StatsCard label="대기" value={count('pending')} unit="건" />
                      <StatsCard label="승인" value={count('approved')} unit="건" />
                      <StatsCard label="발주" value={count('ordered')} unit="건" />
                      <StatsCard label="입고완료" value={count('delivered')} unit="건" />
                    </>
                  )
                })()}
              </div>
            )}

            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <div className="mb-2 flex justify-end">
                <a
                  className={buttonVariants({ variant: 'outline', size: 'standard' })}
                  role="button"
                  href={`/api/admin/materials/export?tab=requests${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                >
                  엑셀 다운로드
                </a>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>요청번호</TableHead>
                    <TableHead>현장</TableHead>
                    <TableHead>요청자</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead>항목수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <EmptyState description="표시할 요청이 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((rq: any) => (
                      <TableRow key={rq.id}>
                        <TableCell className="font-medium text-foreground">
                          <a
                            className="underline"
                            href={`/dashboard/admin/materials/requests/${rq.id}`}
                          >
                            {rq.request_number || rq.id}
                          </a>
                        </TableCell>
                        <TableCell>{rq.sites?.name || '-'}</TableCell>
                        <TableCell>
                          {rq.requested_by ? (
                            <a
                              href={`/dashboard/admin/users/${rq.requested_by}`}
                              className="underline-offset-2 hover:underline"
                              title="사용자 상세 보기"
                            >
                              {rq.requester?.full_name || rq.requested_by}
                            </a>
                          ) : (
                            <span>{rq.requester?.full_name || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rq.request_date
                            ? new Date(rq.request_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {(rq.items || rq.material_request_items || []).length}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {tab === 'productions' && (
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>생산번호</TableHead>
                  <TableHead>현장</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead>생산일</TableHead>
                  <TableHead>품질상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10">
                      <EmptyState description="표시할 생산 정보가 없습니다." />
                    </TableCell>
                  </TableRow>
                ) : (
                  productions.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">
                        {p.production_number || p.id}
                      </TableCell>
                      <TableCell>{p.sites?.name || '-'}</TableCell>
                      <TableCell className="text-right">{p.produced_quantity ?? 0}</TableCell>
                      <TableCell>
                        {p.production_date
                          ? new Date(p.production_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </TableCell>
                      <TableCell>{p.quality_status || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === 'shipments' && (
          <div className="space-y-4">
            {/* Summary */}
            {Array.isArray(shipments) && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(() => {
                  const total = (shipments as any[]).reduce(
                    (acc, s) => acc + Number((s as any)?.total_amount || 0),
                    0
                  )
                  const paid = (shipments as any[]).reduce((acc, s) => {
                    const ps = Array.isArray((s as any)?.payments) ? (s as any).payments : []
                    const sum = ps.reduce((a: number, p: any) => a + Number(p?.amount || 0), 0)
                    return acc + sum
                  }, 0)
                  const outstanding = Math.max(0, total - paid)
                  const count = (shipments as any[]).length
                  return (
                    <>
                      <StatsCard label="총 출고건수" value={count} unit="건" />
                      <StatsCard label="총액" value={total} unit="KRW" />
                      <StatsCard label="수금" value={paid} unit="KRW" />
                      <StatsCard label="미수" value={outstanding} unit="KRW" />
                    </>
                  )
                })()}
              </div>
            )}

            {/* Per-site summary bar */}
            {Array.isArray(shipments) && shipments.length > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-max">
                  {(() => {
                    const map = new Map<string, { total: number; paid: number; count: number }>()
                    ;(shipments as any[]).forEach((s: any) => {
                      const site = s.sites?.name || '-'
                      const total = Number(s.total_amount || 0)
                      const paid = Array.isArray(s.payments)
                        ? s.payments.reduce(
                            (acc: number, p: any) => acc + Number(p?.amount || 0),
                            0
                          )
                        : 0
                      const cur = map.get(site) || { total: 0, paid: 0, count: 0 }
                      cur.total += total
                      cur.paid += paid
                      cur.count += 1
                      map.set(site, cur)
                    })
                    return Array.from(map.entries())
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([site, v]) => {
                        const outstanding = Math.max(0, v.total - v.paid)
                        return (
                          <div key={site} className="rounded-lg border bg-card p-3 shadow-sm">
                            <div className="text-sm font-medium mb-1">{site}</div>
                            <div className="text-xs text-muted-foreground">건수 {v.count}</div>
                            <div className="mt-1 text-xs">
                              총액 {Math.round(v.total).toLocaleString('ko-KR')} KRW
                            </div>
                            <div className="text-xs">
                              수금 {Math.round(v.paid).toLocaleString('ko-KR')} KRW
                            </div>
                            <div className="text-xs">
                              미수 {Math.round(outstanding).toLocaleString('ko-KR')} KRW
                            </div>
                          </div>
                        )
                      })
                  })()}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <a
                    href="/dashboard/admin/materials/payments-report"
                    className={buttonVariants({ variant: 'outline', size: 'standard' })}
                    role="button"
                  >
                    결제 리포트
                  </a>
                </div>
                <a
                  className={buttonVariants({ variant: 'outline', size: 'standard' })}
                  role="button"
                  href={`/api/admin/materials/export?tab=shipments${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                >
                  엑셀 다운로드
                </a>
              </div>
              <ShipmentsTable shipments={shipments as any} />
            </div>
          </div>
        )}

        {/* NPC-1000 탭은 현장별 재고현황에 통합되어 제거됨 */}

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total}건 중 {(page - 1) * limit + Math.min(1, total)}-{Math.min(page * limit, total)}{' '}
            표시
          </div>
          <div className="flex gap-2">
            <Link
              href={buildQuery({ page: String(Math.max(1, page - 1)) })}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              {t('common.prev')}
            </Link>
            <Link
              href={buildQuery({ page: String(Math.min(pages, page + 1)) })}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}
            >
              {t('common.next')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
