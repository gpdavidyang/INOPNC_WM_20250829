import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
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
import ShipmentsTable from '@/components/admin/materials/ShipmentsTable'
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
    const res = await getMaterialRequests(page, limit, search, undefined, site_id || undefined)
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
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    // limit 고정(100) → 쿼리 파라미터로 전달하지 않음
    params.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">자재 관리</h1>
        <p className="text-sm text-muted-foreground">현장별 자재 재고(최근 갱신 순) – 읽기 전용</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { key: 'inventory', label: '현장별 재고현황' },
          { key: 'requests', label: '입고요청 관리' },
          { key: 'productions', label: '생산정보 관리' },
          { key: 'shipments', label: '출고배송 관리' },
        ].map(t => (
          <Link
            key={t.key}
            href={buildQuery({ tab: t.key })}
            className={`px-3 py-1.5 rounded-md border text-sm ${tab === t.key ? 'bg-gray-100' : 'bg-white'}`}
          >
            {t.label}
          </Link>
        ))}
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
          {/* 상태 필터 제거 (승인/반려 개념 미사용) */}
          {/* 현장 ID 필드 제거 */}
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
              적용
            </Button>
            <Link
              href={buildQuery({ page: '1', search: '', status: '', site_id: '' })}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            >
              초기화
            </Link>
          </div>
        </form>
      </div>

      {/* Tables */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="mb-2 flex justify-end">
            <a
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
              href={`/api/admin/materials/export?tab=inventory${search ? `&search=${encodeURIComponent(search)}` : ''}`}
            >
              엑셀 다운로드
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-4 bg-white">
              <div className="text-xs text-gray-500">현장 수</div>
              <div className="text-2xl font-semibold">{npcSummary?.total_sites ?? '-'}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white">
              <div className="text-xs text-gray-500">입고</div>
              <div className="text-2xl font-semibold">{npcSummary?.total_incoming ?? '-'}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white">
              <div className="text-xs text-gray-500">사용</div>
              <div className="text-2xl font-semibold">{npcSummary?.total_used ?? '-'}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white">
              <div className="text-xs text-gray-500">잔여</div>
              <div className="text-2xl font-semibold">{npcSummary?.total_remaining ?? '-'}</div>
            </div>
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
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      표시할 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  npcSites.map((s: any) => (
                    <TableRow key={s.site_id}>
                      <TableCell className="font-medium text-foreground">
                        {s.site_name || '-'}
                      </TableCell>
                      <TableCell>
                        {s.latest_date ? new Date(s.latest_date).toLocaleDateString('ko-KR') : '-'}
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
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <div className="mb-2 flex justify-end">
            <a
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
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
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground py-10"
                  >
                    표시할 요청이 없습니다.
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
                    <TableCell>{rq.requester?.full_name || '-'}</TableCell>
                    <TableCell>
                      {rq.request_date
                        ? new Date(rq.request_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell>{(rq.items || rq.material_request_items || []).length}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground py-10"
                  >
                    표시할 생산 정보가 없습니다.
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
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <div className="mb-2 flex justify-end">
            <a
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
              href={`/api/admin/materials/export?tab=shipments${search ? `&search=${encodeURIComponent(search)}` : ''}`}
            >
              엑셀 다운로드
            </a>
          </div>
          <ShipmentsTable shipments={shipments as any} />
        </div>
      )}

      {/* NPC-1000 탭은 현장별 재고현황에 통합되어 제거됨 */}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total}건 중 {(page - 1) * limit + Math.min(1, total)}–{Math.min(page * limit, total)}{' '}
          표시
        </div>
        <div className="flex gap-2">
          <Link
            href={buildQuery({ page: String(Math.max(1, page - 1)) })}
            className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          >
            이전
          </Link>
          <Link
            href={buildQuery({ page: String(Math.min(pages, page + 1)) })}
            className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}
          >
            다음
          </Link>
        </div>
      </div>
    </div>
  )
}
