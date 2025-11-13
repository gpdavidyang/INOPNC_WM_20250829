import type { Metadata } from 'next'
import Link from 'next/link'
import PillTabLinks from '@/components/ui/pill-tab-links'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ADMIN_PARTNER_COMPANIES_STUB } from '@/lib/admin/stub-data'
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
import { Badge } from '@/components/ui/badge'
import ShipmentsTable from '@/components/admin/materials/ShipmentsTable'
import EmptyState from '@/components/ui/empty-state'
import InventorySiteFilterSelect from '@/components/admin/materials/InventorySiteFilterSelect'
import MaterialFilterSelect from '@/components/admin/materials/MaterialFilterSelect'
import PriorityFilterSelect from '@/components/admin/materials/PriorityFilterSelect'
import {
  getMaterialRequests,
  getMaterialShipments,
  getMaterialProductions,
  getMaterialInventorySummary,
  getMaterialInventoryList,
} from '@/app/actions/admin/materials'
import { INVENTORY_SORT_COLUMNS, type InventorySortKey } from '@/lib/admin/materials/constants'
import {
  MATERIAL_PRIORITY_BADGE_VARIANTS,
  MATERIAL_PRIORITY_LABELS,
  isMaterialPriorityValue,
} from '@/lib/materials/priorities'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  parseProductionMetadata,
  extractProductionMemo,
  type ProductionMetadataItem,
} from '@/lib/materials/production-support'

export const metadata: Metadata = {
  title: '자재 관리',
}

const numberFormatter = new Intl.NumberFormat('ko-KR')

function summarizeMaterial(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '-'
  }
  const primary = items[0]
  const baseLabel = primary.material_name || primary.material_code || '자재'
  return items.length > 1 ? `${baseLabel} 외 ${items.length - 1}건` : baseLabel
}

function summarizeQuantity(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '-'
  }
  const total = items.reduce(
    (sum: number, item: any) => sum + Number(item.requested_quantity ?? 0),
    0
  )
  if (!total) return '-'
  const unit = items.length === 1 ? items[0]?.unit || '' : ''
  const formatted = numberFormatter.format(total)
  return unit ? `${formatted} ${unit}` : formatted
}

const PRIORITY_NOTE_TAG_REGEX =
  /^\s*\[(?:낮음|보통|높음|긴급|일반|최우선|low|normal|high|urgent)\]\s*/i

function cleanPriorityNote(note?: string | null): string {
  if (!note) return ''
  return note.replace(PRIORITY_NOTE_TAG_REGEX, '').trim()
}

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const supabase = createClient()

  // Inline settings datasets (initialized; populated when tab === 'settings')
  let materialsData: Array<{
    id: string
    code: string | null
    name: string
    unit: string | null
    is_active: boolean | null
    specification?: string | null
  }> = []
  let paymentByCategory: Record<
    string,
    Array<{ id: string; name: string; is_active: boolean | null; sort_order: number | null }>
  > = {
    billing: [],
    shipping: [],
    freight: [],
  }
  let partnersCount: number | null = null
  let partnersPreview: Array<{ id: string; company_name: string; status?: string | null }> = []

  const rawTab = (searchParams?.tab as string) || 'inventory'
  const tab = (
    ['inventory', 'requests', 'productions', 'shipments', 'settings'].includes(rawTab)
      ? rawTab
      : 'inventory'
  ) as
    | 'inventory' // 현장별 재고/요약
    | 'requests' // 입고요청 관리
    | 'productions' // 생산정보 관리
    | 'shipments' // 출고배송 관리
    | 'settings' // 설정
  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  // 페이지 크기 고정: 100
  const limit = 100
  const search = ((searchParams?.search as string) || '').trim()
  // 상태 개념 미사용(승인/반려 제거)
  const site_id = ((searchParams?.site_id as string) || '').trim()
  const materialNameFilter = ((searchParams?.material_name as string) || '').trim()
  const priorityRaw = ((searchParams?.priority as string) || '').trim()
  const priorityFilter = isMaterialPriorityValue(priorityRaw) ? priorityRaw : ''
  const date_from = ((searchParams?.date_from as string) || '').trim() || undefined
  const date_to = ((searchParams?.date_to as string) || '').trim() || undefined
  const enableInventorySort = tab === 'inventory'
  const rawSortBy = enableInventorySort ? (searchParams?.sort_by as string) : undefined
  const sortBy: InventorySortKey =
    enableInventorySort &&
    rawSortBy &&
    Object.prototype.hasOwnProperty.call(INVENTORY_SORT_COLUMNS, rawSortBy)
      ? (rawSortBy as InventorySortKey)
      : 'updated_at'
  const sortOrder: 'asc' | 'desc' =
    enableInventorySort && (searchParams?.sort_order as string) === 'asc' ? 'asc' : 'desc'

  let requests: any[] = []
  let shipments: any[] = []
  let productions: any[] = []
  let inventorySummary: any | null = null
  let inventoryItems: any[] = []
  let siteFilterOptions: Array<{ id: string; name: string | null }> = []
  let materialOptions: Array<{ id: string; name: string | null; code: string | null }> = []
  let total = 0
  let pages = 1

  if (tab === 'inventory') {
    const [summaryRes, listRes] = await Promise.all([
      getMaterialInventorySummary(),
      getMaterialInventoryList(
        page,
        limit,
        search,
        site_id || undefined,
        undefined,
        sortBy,
        sortOrder
      ),
    ])
    inventorySummary = summaryRes.success ? (summaryRes.data as any) : null
    if (listRes.success && listRes.data) {
      inventoryItems = (listRes.data as any).items || []
      total = (listRes.data as any).total || 0
      pages = (listRes.data as any).pages || 1
    }

    const { data: siteOptionsData, error: siteOptionsError } = await supabase
      .from('sites')
      .select('id, name, status')
      .order('name', { ascending: true })
      .limit(200)

    if (!siteOptionsError && Array.isArray(siteOptionsData)) {
      siteFilterOptions = siteOptionsData.map((site: { id: string; name: string | null }) => ({
        id: site.id,
        name: site.name,
      }))
    }
  } else if (tab === 'requests') {
    const res = await getMaterialRequests(
      page,
      limit,
      search,
      site_id || undefined,
      materialNameFilter || undefined,
      priorityFilter || undefined,
      undefined
    )
    requests = res.success && res.data ? (res.data as any).requests : []
    total = res.success && res.data ? (res.data as any).total : 0
    pages = res.success && res.data ? (res.data as any).pages : 1

    const [{ data: materialList }, { data: siteOptionsData, error: siteOptionsError }] =
      await Promise.all([
        supabase
          .from('materials')
          .select('id, name, code')
          .eq('is_active', true)
          .order('name', { ascending: true })
          .limit(200),
        supabase
          .from('sites')
          .select('id, name, status')
          .order('name', { ascending: true })
          .limit(200),
      ])

    if (Array.isArray(materialList)) {
      materialOptions = materialList.map((mat: any) => ({
        id: mat.id,
        name: mat.name ?? null,
        code: mat.code ?? null,
      }))
    }

    if (!siteOptionsError && Array.isArray(siteOptionsData)) {
      siteFilterOptions = siteOptionsData.map((site: { id: string; name: string | null }) => ({
        id: site.id,
        name: site.name,
      }))
    }
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
  } else if (tab === 'settings') {
    // Load compact datasets for inline settings sections
    // Materials (compact list)
    const { data: mData } = await supabase
      .from('materials')
      .select('id, code, name, unit, is_active, specification')
      .order('name', { ascending: true })
      .limit(10)
    materialsData = (mData || []) as any
    // Payment methods grouped
    const categories: Array<'billing' | 'shipping' | 'freight'> = ['billing', 'shipping', 'freight']
    try {
      const { data: pm } = await supabase
        .from('payment_methods')
        .select('id, name, category, is_active, sort_order')
        .in('category', categories as any)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      const rows = pm || []
      const allMissingCategory = rows.length === 0 || rows.every((r: any) => r?.category == null)

      if (!allMissingCategory) {
        for (const it of rows) {
          const cat = (it as any).category || 'billing'
          if (!paymentByCategory[cat]) paymentByCategory[cat] = []
          paymentByCategory[cat].push({
            id: (it as any).id,
            name: (it as any).name,
            is_active: (it as any).is_active ?? null,
            sort_order: (it as any).sort_order ?? null,
          })
        }
      } else {
        // Legacy fallback: category column exists but values are NULL or table doesn't support category
        const LEGACY_DEFAULT_CATEGORY: Record<string, 'billing' | 'shipping' | 'freight'> = {
          즉시청구: 'billing',
          월말청구: 'billing',
          택배: 'shipping',
          화물: 'shipping',
          직접: 'shipping',
          선불: 'freight',
          착불: 'freight',
        }
        const decodeLegacyName = (
          raw: string
        ): { category: 'billing' | 'shipping' | 'freight'; name: string } => {
          const idx = raw.indexOf('::')
          if (idx > 0) {
            const prefix = raw.slice(0, idx).toLowerCase()
            const label = raw.slice(idx + 2)
            if (prefix === 'billing' || prefix === 'shipping' || prefix === 'freight') {
              return { category: prefix as any, name: label }
            }
          }
          const inferred = LEGACY_DEFAULT_CATEGORY[raw] ?? 'billing'
          return { category: inferred, name: raw }
        }

        const { data: legacy } = await supabase
          .from('payment_methods')
          .select('id, name, is_active')
          .order('name', { ascending: true })
        for (const it of legacy || []) {
          const decoded = decodeLegacyName((it as any).name || '')
          paymentByCategory[decoded.category].push({
            id: (it as any).id,
            name: decoded.name,
            is_active: (it as any).is_active ?? null,
            sort_order: null,
          })
        }
      }
    } catch {
      // best-effort; leave as empty
    }
    // Material suppliers quick count sourced directly from material_suppliers
    try {
      const supplierClient = (() => {
        try {
          return createServiceRoleClient()
        } catch {
          return supabase
        }
      })()

      const { data: suppliersData, error: suppliersError } = await supplierClient
        .from('material_suppliers')
        .select('id, name, is_active')
        .order('name', { ascending: true })
      if (suppliersError) throw suppliersError

      partnersCount = suppliersData?.length ?? 0
      partnersPreview = (suppliersData || []).slice(0, 10).map(item => ({
        id: item.id,
        company_name: item.name || '-',
        status: item.is_active === false ? 'inactive' : 'active',
      }))
    } catch (apiError) {
      console.error(
        '[AdminMaterials] material_suppliers query failed, falling back to stub:',
        apiError
      )
      partnersCount = ADMIN_PARTNER_COMPANIES_STUB.length
      partnersPreview = ADMIN_PARTNER_COMPANIES_STUB.slice(0, 10).map((p: any) => ({
        id: p.id,
        company_name: p.company_name,
        status: p.status ?? null,
      }))
    }
  }

  const buildQuery = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const nextTab = (overrides.tab as string) || tab
    params.set('tab', nextTab)
    if (search) params.set('search', search)
    if (site_id) params.set('site_id', site_id)
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    if (nextTab === 'inventory') {
      const targetSortBy =
        overrides.sort_by || (tab === 'inventory' && !overrides.tab ? sortBy : 'updated_at')
      const targetSortOrder =
        overrides.sort_order || (tab === 'inventory' && !overrides.tab ? sortOrder : 'desc')
      params.set('sort_by', targetSortBy)
      params.set('sort_order', targetSortOrder)
    } else if (nextTab === 'requests') {
      if (materialNameFilter) params.set('material_name', materialNameFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
    }
    // limit 고정(100) → 쿼리 파라미터로 전달하지 않음
    params.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  const renderSortableHead = (
    label: string,
    key: InventorySortKey,
    options?: { align?: 'left' | 'right' }
  ) => {
    const alignRight = options?.align === 'right'
    const isActive = tab === 'inventory' && sortBy === key
    const nextOrder = isActive && sortOrder === 'asc' ? 'desc' : 'asc'
    const icon = !isActive ? (
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    ) : sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    )

    return (
      <TableHead
        className={cn(alignRight && 'text-right')}
        aria-sort={isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <Link
          href={buildQuery({ page: '1', sort_by: key, sort_order: nextOrder })}
          className={cn(
            'inline-flex items-center gap-1 text-sm font-semibold text-foreground',
            alignRight && 'justify-end w-full'
          )}
          scroll={false}
        >
          <span>{label}</span>
          {icon}
        </Link>
      </TableHead>
    )
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="자재 관리"
        description="현장별 재고/요청/출고/생산 정보를 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '자재 관리' }]}
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
              { key: 'requests', label: '입고요청', href: buildQuery({ tab: 'requests' }) },
              {
                key: 'productions',
                label: '생산정보',
                href: buildQuery({ tab: 'productions' }),
              },
              {
                key: 'shipments',
                label: '출고배송결제',
                href: buildQuery({ tab: 'shipments' }),
              },
              {
                key: 'settings',
                label: '설정',
                href: buildQuery({ tab: 'settings' }),
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
            {tab === 'inventory' && (
              <>
                <input type="hidden" name="sort_by" value={sortBy} />
                <input type="hidden" name="sort_order" value={sortOrder} />
              </>
            )}
            <div className="lg:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">검색어</label>
              <Input
                name="search"
                defaultValue={search}
                placeholder={
                  tab === 'inventory'
                    ? '자재명/코드/현장'
                    : tab === 'requests'
                      ? '요청번호/메모'
                      : tab === 'productions'
                        ? '생산번호/메모'
                        : '검색어'
                }
              />
            </div>
            {tab === 'inventory' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">현장별</label>
                <InventorySiteFilterSelect
                  sites={siteFilterOptions}
                  defaultValue={site_id}
                  placeholder="전체 현장"
                />
              </div>
            )}
            {/* 요청 탭: 현장/자재/긴급도 필터 */}
            {tab === 'requests' && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">현장</label>
                  <InventorySiteFilterSelect
                    sites={siteFilterOptions}
                    defaultValue={site_id}
                    placeholder="전체 현장"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm text-muted-foreground mb-1">자재명</label>
                  <MaterialFilterSelect
                    options={materialOptions}
                    defaultValue={materialNameFilter}
                    placeholder="전체 자재"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">긴급도</label>
                  <PriorityFilterSelect defaultValue={priorityFilter || ''} />
                </div>
              </>
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
              {(() => {
                const resetOverrides: Record<string, string> = {
                  page: '1',
                  search: '',
                  site_id: '',
                }
                if (tab === 'inventory') {
                  resetOverrides.sort_by = 'updated_at'
                  resetOverrides.sort_order = 'desc'
                } else if (tab === 'requests') {
                  resetOverrides.material_name = ''
                  resetOverrides.priority = ''
                } else if (tab === 'shipments') {
                  resetOverrides.date_from = ''
                  resetOverrides.date_to = ''
                }
                return (
                  <Link
                    href={buildQuery(resetOverrides)}
                    className={buttonVariants({ variant: 'outline', size: 'standard' })}
                    role="button"
                  >
                    {t('common.reset')}
                  </Link>
                )
              })()}
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
              <StatsCard
                label="관리 품목"
                value={Number(inventorySummary?.total_materials ?? 0)}
                unit="종"
              />
              <StatsCard
                label="현장 수"
                value={Number(inventorySummary?.tracked_sites ?? 0)}
                unit="곳"
              />
              <StatsCard
                label="총 재고"
                value={Number(inventorySummary?.total_stock_quantity ?? 0)}
                unit="ea"
              />
              <StatsCard
                label="재고 없음"
                value={Number(inventorySummary?.out_of_stock_items ?? 0)}
                unit="건"
              />
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderSortableHead('자재', 'material')}
                    {renderSortableHead('현장', 'site')}
                    {renderSortableHead('현재 재고', 'current_stock', { align: 'right' })}
                    <TableHead>상태</TableHead>
                    {renderSortableHead('업데이트', 'updated_at')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10">
                        <EmptyState description="표시할 재고 항목이 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventoryItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col">
                            <span>{item.material_name || '-'}</span>
                            {item.material_code && (
                              <span className="text-xs text-muted-foreground">
                                {item.material_code}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.site_name || item.site_id || '-'}</TableCell>
                        <TableCell className="text-right">
                          {Number(item.current_stock ?? 0).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            switch (item.status) {
                              case 'out_of_stock':
                                return <Badge variant="error">재고 없음</Badge>
                              default:
                                return <Badge variant="success">정상</Badge>
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          {item.updated_at
                            ? new Date(item.updated_at).toLocaleString('ko-KR')
                            : '-'}
                        </TableCell>
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
                    <TableHead>현장명</TableHead>
                    <TableHead>자재명</TableHead>
                    <TableHead className="text-right">요청수량</TableHead>
                    <TableHead>요청자</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead>긴급도</TableHead>
                    <TableHead>비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10">
                        <EmptyState description="표시할 요청이 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((rq: any) => (
                      <TableRow key={rq.id}>
                        <TableCell>{rq.sites?.name || '-'}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {summarizeMaterial(rq.items || rq.material_request_items || [])}
                        </TableCell>
                        <TableCell className="text-right">
                          {summarizeQuantity(rq.items || rq.material_request_items || [])}
                        </TableCell>
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
                          {isMaterialPriorityValue(rq.priority) ? (
                            <Badge variant={MATERIAL_PRIORITY_BADGE_VARIANTS[rq.priority]}>
                              {MATERIAL_PRIORITY_LABELS[rq.priority]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {cleanPriorityNote(rq.notes) || '-'}
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
          <div className="space-y-4">
            {Array.isArray(productions) && productions.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const totalQty = productions.reduce(
                    (sum, row) => sum + Number(row.produced_quantity ?? 0),
                    0
                  )
                  const countByStatus = (status: string) =>
                    productions.filter(
                      row => String(row.quality_status || '').toLowerCase() === status
                    ).length
                  return (
                    <>
                      <StatsCard label="생산건수" value={productions.length} unit="건" />
                      <StatsCard label="총 생산량" value={totalQty} unit="ea" />
                      <StatsCard label="승인" value={countByStatus('approved')} unit="건" />
                      <StatsCard label="대기" value={countByStatus('pending')} unit="건" />
                    </>
                  )
                })()}
              </div>
            )}
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">자재</TableHead>
                    <TableHead className="w-[120px] text-right">생산수량</TableHead>
                    <TableHead className="w-[140px] whitespace-nowrap">생산일</TableHead>
                    <TableHead className="min-w-[260px]">메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10">
                        <EmptyState description="표시할 생산 정보가 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    productions.map((p: any) => {
                      const metadata = parseProductionMetadata(p.quality_notes)
                      const noteText = extractProductionMemo(p.quality_notes, metadata) || '-'
                      const fallbackItems: ProductionMetadataItem[] = Array.isArray(
                        metadata?.fallback_items
                      )
                        ? (metadata!.fallback_items as ProductionMetadataItem[]).filter(
                            item => item && item.material_id
                          )
                        : []
                      const firstItem =
                        Array.isArray(p.material_production_items) &&
                        p.material_production_items.length > 0
                          ? p.material_production_items[0]
                          : null
                      const firstFallback =
                        !firstItem && fallbackItems.length > 0 ? fallbackItems[0] : null
                      const fallbackSnapshot = firstFallback?.material_snapshot || null
                      const primaryMaterialName = firstItem
                        ? firstItem.materials?.name
                        : fallbackSnapshot?.name || p.materials?.name || '-'
                      const primaryMaterialCode = firstItem
                        ? firstItem.materials?.code
                        : fallbackSnapshot?.code || p.materials?.code || null
                      const totalItems = firstItem
                        ? Array.isArray(p.material_production_items)
                          ? p.material_production_items.length
                          : 1
                        : fallbackItems.length || 0
                      const hasMultiple = totalItems > 1
                      const extraCount = Math.max(0, totalItems - 1)
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-foreground min-w-[220px]">
                            <div className="flex flex-col">
                              <span>
                                {primaryMaterialName || '-'}
                                {hasMultiple && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    외 {extraCount}건
                                  </span>
                                )}
                              </span>
                              {primaryMaterialCode && (
                                <span className="text-xs text-muted-foreground">
                                  {primaryMaterialCode}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right w-[120px] whitespace-nowrap">
                            {Number(p.produced_quantity ?? 0).toLocaleString('ko-KR')}
                          </TableCell>
                          <TableCell className="w-[140px] whitespace-nowrap">
                            {p.production_date
                              ? new Date(p.production_date).toLocaleDateString('ko-KR')
                              : '-'}
                          </TableCell>
                          <TableCell className="max-w-md min-w-[260px] truncate">
                            {noteText}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {tab === 'shipments' && (
          <div className="space-y-4">
            {/* Summary */}
            {Array.isArray(shipments) && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
                  const getStatusCount = (predicate: (status: string) => boolean) =>
                    (shipments as any[]).filter(s => predicate(String((s as any)?.status || '')))
                      .length
                  const completed = getStatusCount(st =>
                    ['shipped', 'delivered'].includes(st.toLowerCase())
                  )
                  const pending = getStatusCount(
                    st => !['shipped', 'delivered', 'cancelled'].includes(st.toLowerCase())
                  )
                  return (
                    <>
                      <StatsCard label="출고건수" value={count} unit="건" />
                      <StatsCard label="금액" value={total} unit="KRW" />
                      <StatsCard label="수금" value={paid} unit="KRW" />
                      <StatsCard label="미수" value={outstanding} unit="KRW" />
                      <StatsCard label="진행" value={pending} unit="건" />
                      <StatsCard label="완료" value={completed} unit="건" />
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
                    const map = new Map<string, { total: number; count: number }>()
                    ;(shipments as any[]).forEach((s: any) => {
                      const site = s.sites?.name || '-'
                      const total = Number(s.total_amount || 0)
                      const cur = map.get(site) || { total: 0, count: 0 }
                      cur.total += total
                      cur.count += 1
                      map.set(site, cur)
                    })
                    return Array.from(map.entries())
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([site, v]) => {
                        return (
                          <div key={site} className="rounded-lg border bg-card p-3 shadow-sm">
                            <div className="text-sm font-medium mb-1">{site}</div>
                            <div className="text-xs text-muted-foreground">건수 {v.count}</div>
                            <div className="mt-1 text-xs">
                              총액 {Math.round(v.total).toLocaleString('ko-KR')} KRW
                            </div>
                          </div>
                        )
                      })
                  })()}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <ShipmentsTable shipments={shipments as any} />
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            {/* Section: 품목 관리 (요약) */}
            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">품목 관리</div>
                  <div className="text-xs text-muted-foreground">
                    자재 코드/명/단위 등 기본 정보를 확인합니다.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/admin/materials/settings/materials/new"
                    className={buttonVariants({ variant: 'primary', size: 'compact' })}
                  >
                    새 품목
                  </Link>
                  <Link
                    href="/dashboard/admin/materials/settings/materials"
                    className={buttonVariants({ variant: 'outline', size: 'compact' })}
                  >
                    관리
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 w-[140px]">코드</th>
                      <th className="px-3 py-2">품명</th>
                      <th className="px-3 py-2 w-[120px]">단위</th>
                      <th className="px-3 py-2 w-[80px]">사용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(materialsData || []).length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>
                          표시할 품목이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      (materialsData || []).map((m: any) => (
                        <tr key={m.id} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">{m.code || '-'}</td>
                          <td className="px-3 py-2">{m.name}</td>
                          <td className="px-3 py-2">{m.unit || '-'}</td>
                          <td className="px-3 py-2">{m.is_active ? 'Y' : 'N'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section: 결제/배송/운임 방식 */}
            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">결제/배송 방식 관리</div>
                  <div className="text-xs text-muted-foreground">
                    청구/배송/운임 결제 방식을 확인합니다.
                  </div>
                </div>
                <Link
                  href="/dashboard/admin/materials/settings/payment-methods"
                  className={buttonVariants({ variant: 'outline', size: 'compact' })}
                >
                  관리
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {(['billing', 'shipping', 'freight'] as const).map(cat => (
                  <div key={cat} className="rounded border bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-foreground">
                      {cat === 'billing'
                        ? '청구방식'
                        : cat === 'shipping'
                          ? '배송방식'
                          : '선불/착불'}
                    </div>
                    <ul className="space-y-1 text-sm">
                      {(paymentByCategory[cat] || []).length === 0 ? (
                        <li className="text-xs text-muted-foreground">등록된 항목 없음</li>
                      ) : (
                        (paymentByCategory[cat] || []).slice(0, 10).map(item => (
                          <li key={item.id} className="flex items-center justify-between">
                            <span className="truncate">{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.is_active ? '사용' : '중지'}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 운송 방식 관리는 배송방식과 중복되어 제거됨 */}

            {/* Section: 자재거래처 관리 (요약) */}
            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">자재거래처 관리</div>
                  <div className="text-xs text-muted-foreground">
                    ‘거래처’는 원료를 공급하는 공급처와 당사 제품을 매입하는 판매처를 포함합니다
                    {partnersCount !== null ? ` · 총 ${partnersCount}개` : ''}.
                  </div>
                </div>
                <Link
                  href="/dashboard/admin/partners"
                  className={buttonVariants({ variant: 'outline', size: 'compact' })}
                >
                  관리
                </Link>
              </div>
              <div className="rounded border bg-white p-0 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2">업체명</th>
                      <th className="px-3 py-2 w-[120px]">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnersPreview.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-muted-foreground" colSpan={2}>
                          등록된 거래업체가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      partnersPreview.map(p => (
                        <tr key={p.id} className="border-t">
                          <td className="px-3 py-2">{p.company_name}</td>
                          <td className="px-3 py-2">
                            {p.status === 'active'
                              ? '활성'
                              : p.status === 'inactive'
                                ? '비활성'
                                : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

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
