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
import {
  getMaterials,
  getMaterialRequests,
  getMaterialShipments,
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
    | 'inventory'
    | 'requests'
    | 'shipments'
    | 'npc1000'
  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '10') || 10
  const limit = Math.min(50, Math.max(10, limitRaw))
  const search = ((searchParams?.search as string) || '').trim()
  const status = ((searchParams?.status as string) || '').trim()
  const site_id = ((searchParams?.site_id as string) || '').trim()
  const date_from = ((searchParams?.date_from as string) || '').trim() || undefined
  const date_to = ((searchParams?.date_to as string) || '').trim() || undefined

  let inventory: any[] = []
  let requests: any[] = []
  let shipments: any[] = []
  let npcSummary: any | null = null
  let npcSites: any[] = []
  let total = 0
  let pages = 1

  if (tab === 'inventory') {
    const res = await getMaterials(
      page,
      limit,
      search,
      (status as any) || undefined,
      site_id || undefined
    )
    inventory = res.success && res.data ? (res.data as any).materials : []
    total = res.success && res.data ? (res.data as any).total : 0
    pages = res.success && res.data ? (res.data as any).pages : 1
  } else if (tab === 'requests') {
    const res = await getMaterialRequests(
      page,
      limit,
      search,
      (status as any) || undefined,
      site_id || undefined
    )
    requests = res.success && res.data ? (res.data as any).requests : []
    total = res.success && res.data ? (res.data as any).total : 0
    pages = res.success && res.data ? (res.data as any).pages : 1
  } else if (tab === 'shipments') {
    const res = await getMaterialShipments(
      page,
      limit,
      site_id || undefined,
      (status as any) || undefined,
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
    if (status) params.set('status', status)
    if (site_id) params.set('site_id', site_id)
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    params.set('limit', String(limit))
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
          { key: 'inventory', label: '재고' },
          { key: 'requests', label: '요청' },
          { key: 'shipments', label: '출고' },
          { key: 'npc1000', label: 'NPC-1000' },
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
                  ? '자재명/코드'
                  : tab === 'requests'
                    ? '요청번호/메모'
                    : '검색어'
              }
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">상태</label>
            <Input name="status" defaultValue={status} placeholder="예: pending/approved" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">현장 ID</label>
            <Input name="site_id" defaultValue={site_id} placeholder="site_id" />
          </div>
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
          <div>
            <label className="block text-sm text-muted-foreground mb-1">페이지 크기</label>
            <select
              name="limit"
              defaultValue={String(limit)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
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
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>현장</TableHead>
                <TableHead>자재</TableHead>
                <TableHead>코드</TableHead>
                <TableHead className="text-right">재고</TableHead>
                <TableHead className="text-right">예약</TableHead>
                <TableHead className="text-right">가용</TableHead>
                <TableHead>갱신</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground py-10"
                  >
                    표시할 재고가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((it: any) => {
                  const current = Number(it.current_stock || 0)
                  const reserved = Number(it.reserved_stock || 0)
                  const available = Math.max(0, current - reserved)
                  return (
                    <TableRow key={it.id}>
                      <TableCell>{it.site?.name || '-'}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {it.material_name || it.materials?.name || 'NPC-1000'}
                      </TableCell>
                      <TableCell>{it.material_code || it.materials?.code || '-'}</TableCell>
                      <TableCell className="text-right">{current.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{reserved.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{available.toLocaleString()}</TableCell>
                      <TableCell>
                        {it.last_updated
                          ? new Date(it.last_updated).toLocaleDateString('ko-KR')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === 'requests' && (
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>요청번호</TableHead>
                <TableHead>현장</TableHead>
                <TableHead>요청자</TableHead>
                <TableHead>상태</TableHead>
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
                      {rq.request_number || rq.id}
                    </TableCell>
                    <TableCell>{rq.sites?.name || '-'}</TableCell>
                    <TableCell>{rq.requester?.full_name || '-'}</TableCell>
                    <TableCell>{rq.status || '-'}</TableCell>
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

      {tab === 'shipments' && (
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>출고번호</TableHead>
                <TableHead>현장</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>출고일</TableHead>
                <TableHead>항목수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground py-10"
                  >
                    표시할 출고가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((sp: any) => (
                  <TableRow key={sp.id}>
                    <TableCell className="font-medium text-foreground">
                      {sp.shipment_number || sp.id}
                    </TableCell>
                    <TableCell>{sp.sites?.name || '-'}</TableCell>
                    <TableCell>{sp.status || '-'}</TableCell>
                    <TableCell>
                      {sp.shipment_date
                        ? new Date(sp.shipment_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell>{(sp.shipment_items || []).length}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === 'npc1000' && (
        <div className="space-y-4">
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
