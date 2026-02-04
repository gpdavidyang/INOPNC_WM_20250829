import {
  getMaterialInventoryList,
  getMaterialInventorySummary,
  getMaterialProductions,
  getMaterialRequests,
  getMaterialShipments,
} from '@/app/actions/admin/materials'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import InventorySiteFilterSelect from '@/components/admin/materials/InventorySiteFilterSelect'
import MaterialFilterSelect from '@/components/admin/materials/MaterialFilterSelect'
import PriorityFilterSelect from '@/components/admin/materials/PriorityFilterSelect'
import ShipmentsTable from '@/components/admin/materials/ShipmentsTable'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { INVENTORY_SORT_COLUMNS, type InventorySortKey } from '@/lib/admin/materials/constants'
import { ADMIN_PARTNER_COMPANIES_STUB } from '@/lib/admin/stub-data'
import {
  isMaterialPriorityValue,
  MATERIAL_PRIORITY_LABELS,
  normalizeMaterialPriority,
  type MaterialPriorityValue,
} from '@/lib/materials/priorities'
import {
  extractProductionMemo,
  parseProductionMetadata,
  type ProductionMetadataItem,
} from '@/lib/materials/production-support'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { cn } from '@/lib/utils'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ClipboardCheck,
  CreditCard,
  Factory,
  Package,
  Settings,
  Truck,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

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
            'inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-white/80 transition-colors',
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
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="자재 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '자재 관리' }]}
      />
      {/* 2. Panoramic Tab Navigation (v1.110 Standard shape outside card) */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-5 w-full h-auto items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
            {[
              {
                key: 'inventory',
                label: '현장별 재고현황',
                icon: Package,
                href: buildQuery({ tab: 'inventory' }),
              },
              {
                key: 'requests',
                label: '입고요청',
                icon: ClipboardCheck,
                href: buildQuery({ tab: 'requests' }),
              },
              {
                key: 'productions',
                label: '생산정보',
                icon: Factory,
                href: buildQuery({ tab: 'productions' }),
              },
              {
                key: 'shipments',
                label: '출고배송결제',
                icon: Truck,
                href: buildQuery({ tab: 'shipments' }),
              },
              {
                key: 'settings',
                label: '설정',
                icon: Settings,
                href: buildQuery({ tab: 'settings' }),
              },
            ].map(item => {
              const isActive = tab === item.key
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-white text-blue-700 shadow-md shadow-blue-100/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
                  )}
                  scroll={false}
                >
                  <item.icon
                    className={cn('w-4 h-4', isActive ? 'text-blue-600' : 'text-gray-400')}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Data Container (Premium Management Card) */}
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden mx-4 sm:mx-6 lg:mx-8">
        <CardContent className="p-6 sm:p-8">
          {/* Filters */}
          <div className="mb-8 rounded-2xl border bg-slate-50/50 p-6 shadow-sm">
            <form
              method="GET"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
            >
              <input type="hidden" name="tab" value={tab} />
              <input type="hidden" name="page" value="1" />
              {tab === 'inventory' && (
                <>
                  <input type="hidden" name="sort_by" value={sortBy} />
                  <input type="hidden" name="sort_order" value={sortOrder} />
                </>
              )}
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                  검색어
                </label>
                <Input
                  name="search"
                  defaultValue={search}
                  className="h-10 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                    현장별 필터
                  </label>
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                      현장
                    </label>
                    <InventorySiteFilterSelect
                      sites={siteFilterOptions}
                      defaultValue={site_id}
                      placeholder="전체 현장"
                    />
                  </div>
                  <div className="lg:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                      자재명
                    </label>
                    <MaterialFilterSelect
                      options={materialOptions}
                      defaultValue={materialNameFilter}
                      placeholder="전체 자재"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                      긴급도
                    </label>
                    <PriorityFilterSelect defaultValue={priorityFilter || ''} />
                  </div>
                </>
              )}
              {tab === 'shipments' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                      시작일
                    </label>
                    <Input
                      type="date"
                      name="date_from"
                      defaultValue={date_from}
                      className="h-10 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-tight px-1">
                      종료일
                    </label>
                    <Input
                      type="date"
                      name="date_to"
                      defaultValue={date_to}
                      className="h-10 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </>
              )}
              {/* 페이지 크기 고정(100) → 선택 필드 제거 */}
              <div className="lg:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="h-10 rounded-xl px-6 bg-[#1A254F] hover:bg-[#111836] text-white font-bold shadow-md shadow-blue-900/10 transition-all"
                >
                  조회하기
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
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'standard' }),
                        'h-10 rounded-xl px-6 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-all'
                      )}
                      role="button"
                    >
                      초기화
                    </Link>
                  )
                })()}
              </div>
            </form>
          </div>

          {/* Tables */}
          {tab === 'inventory' && (
            <div className="space-y-4">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-black text-[#1A254F] tracking-tight">재고 요약 현황</h3>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-xl border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold px-4 transition-all"
                >
                  <a
                    href={`/api/admin/materials/export?tab=inventory${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  >
                    엑셀 다운로드
                  </a>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                {[
                  {
                    label: '관리 품목',
                    value: inventorySummary?.total_materials ?? 0,
                    unit: '종',
                  },
                  { label: '현장 수', value: inventorySummary?.tracked_sites ?? 0, unit: '곳' },
                  {
                    label: '총 재고',
                    value: inventorySummary?.total_stock_quantity ?? 0,
                    unit: '개',
                  },
                  {
                    label: '재고 없음',
                    value: inventorySummary?.out_of_stock_items ?? 0,
                    unit: '건',
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100 shadow-sm"
                  >
                    <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
                      {Number(stat.value).toLocaleString('ko-KR')}{' '}
                      <span className="text-sm font-bold not-italic ml-0.5 opacity-50">
                        {stat.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-slate-200">
                <Table>
                  <TableHeader className="bg-[#8da0cd]">
                    <TableRow className="hover:bg-transparent border-none">
                      {renderSortableHead('자재', 'material')}
                      {renderSortableHead('현장', 'site')}
                      {renderSortableHead('현재 재고', 'current_stock', { align: 'right' })}
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter text-center">
                        상태
                      </TableHead>
                      {renderSortableHead('업데이트', 'updated_at')}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-20">
                          <EmptyState description="표시할 재고 항목이 없습니다." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventoryItems.map((item: any) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-bold text-[#1A254F] py-4">
                            <div className="flex flex-col gap-0.5">
                              <span>{item.material_name || '-'}</span>
                              {item.material_code && (
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">
                                  {item.material_code}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-600">
                            {item.site_name || item.site_id || '-'}
                          </TableCell>
                          <TableCell className="text-right font-black text-[#1A254F] italic">
                            {Number(item.current_stock ?? 0).toLocaleString('ko-KR')}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              switch (item.status) {
                                case 'out_of_stock':
                                  return (
                                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold text-[10px] rounded-lg h-6 px-2 shadow-none">
                                      재고 없음
                                    </Badge>
                                  )
                                default:
                                  return (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px] rounded-lg h-6 px-2 shadow-none">
                                      정상
                                    </Badge>
                                  )
                              }
                            })()}
                          </TableCell>
                          <TableCell className="text-slate-400 font-medium text-[11px] italic">
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
            <div className="space-y-6">
              <div className="mb-6 flex justify-between items-center px-1">
                <h3 className="text-lg font-black text-[#1A254F] tracking-tight">입고 요청 요약</h3>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-xl border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold px-4 transition-all"
                >
                  <a
                    href={`/api/admin/materials/export?tab=requests${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  >
                    엑셀 다운로드
                  </a>
                </Button>
              </div>
              {/* Requests summary cards */}
              {Array.isArray(requests) && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full mb-8">
                  {(() => {
                    const totalReq = requests.length
                    const uniqueSiteCount = (() => {
                      const siteIds = new Set<string>()
                      requests.forEach(rq => {
                        const siteKey =
                          (rq.site_id && String(rq.site_id)) ||
                          (rq.sites?.id && String(rq.sites.id)) ||
                          rq.sites?.name ||
                          ''
                        if (siteKey) {
                          siteIds.add(siteKey)
                        }
                      })
                      return siteIds.size
                    })()
                    const totalRequestQuantity = requests.reduce((sum, rq) => {
                      const items = Array.isArray(rq.items)
                        ? rq.items
                        : Array.isArray(rq.material_request_items)
                          ? rq.material_request_items
                          : []
                      const itemSum = items.reduce(
                        (acc: number, item: any) => acc + Number(item?.requested_quantity ?? 0),
                        0
                      )
                      return sum + itemSum
                    }, 0)
                    const priorityCounts: Record<MaterialPriorityValue, number> = {
                      low: 0,
                      normal: 0,
                      high: 0,
                      urgent: 0,
                    }
                    requests.forEach(rq => {
                      const priority = normalizeMaterialPriority(rq?.priority)
                      priorityCounts[priority] += 1
                    })
                    const priorityOrder: MaterialPriorityValue[] = [
                      'urgent',
                      'high',
                      'normal',
                      'low',
                    ]

                    const stats = [
                      { label: '요청건수', value: totalReq, unit: '건', color: 'bg-slate-50' },
                      {
                        label: '요청현장수',
                        value: uniqueSiteCount,
                        unit: '곳',
                        color: 'bg-slate-50',
                      },
                      {
                        label: '요청수량',
                        value: totalRequestQuantity,
                        unit: '개',
                        color: 'bg-blue-50/50',
                      },
                      ...priorityOrder.map(p => ({
                        label: `긴급도 (${MATERIAL_PRIORITY_LABELS[p]})`,
                        value: priorityCounts[p],
                        unit: '건',
                        color:
                          p === 'urgent'
                            ? 'bg-rose-50/50'
                            : p === 'high'
                              ? 'bg-amber-50/50'
                              : 'bg-slate-50',
                      })),
                    ]

                    return stats.map((stat, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100 shadow-sm',
                          stat.color
                        )}
                      >
                        <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
                          {stat.label}
                        </div>
                        <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
                          {Number(stat.value).toLocaleString('ko-KR')}{' '}
                          <span className="text-sm font-bold not-italic ml-0.5 opacity-50">
                            {stat.unit}
                          </span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}

              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-slate-200">
                <Table>
                  <TableHeader className="bg-[#8da0cd]">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                        현장명
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                        자재명
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter text-right">
                        요청수량
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                        요청자
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                        요청일
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter text-center">
                        긴급도
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                        비고
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-20">
                          <EmptyState description="표시할 요청이 없습니다." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((rq: any) => (
                        <TableRow key={rq.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-medium text-slate-600 italic text-[13px]">
                            {rq.sites?.name || '-'}
                          </TableCell>
                          <TableCell className="font-bold text-[#1A254F] py-4">
                            {summarizeMaterial(rq.items || rq.material_request_items || [])}
                          </TableCell>
                          <TableCell className="text-right font-black text-[#1A254F] italic">
                            {summarizeQuantity(rq.items || rq.material_request_items || [])}
                          </TableCell>
                          <TableCell className="font-medium text-slate-600">
                            {rq.requested_by ? (
                              <Link
                                href={`/dashboard/admin/users/${rq.requested_by}`}
                                className="text-blue-600 hover:underline font-bold"
                                title="사용자 상세 보기"
                              >
                                {rq.requester?.full_name || rq.requested_by}
                              </Link>
                            ) : (
                              <span>{rq.requester?.full_name || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 font-medium text-[11px] italic">
                            {rq.request_date
                              ? new Date(rq.request_date).toLocaleDateString('ko-KR')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {isMaterialPriorityValue(rq.priority) ? (
                              <Badge
                                className={cn(
                                  'font-bold text-[10px] rounded-lg h-6 px-2 shadow-none border-none',
                                  rq.priority === 'urgent'
                                    ? 'bg-rose-100 text-rose-700'
                                    : rq.priority === 'high'
                                      ? 'bg-amber-100 text-amber-700'
                                      : rq.priority === 'normal'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-500'
                                )}
                              >
                                {MATERIAL_PRIORITY_LABELS[rq.priority]}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-xs text-slate-400 font-medium">
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
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  {[
                    { label: '생산건수', value: productions.length, unit: '건' },
                    {
                      label: '총 생산량',
                      value: productions.reduce(
                        (sum, row) => sum + Number(row.produced_quantity ?? 0),
                        0
                      ),
                      unit: '개',
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100 shadow-sm"
                    >
                      <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
                        {stat.label}
                      </div>
                      <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
                        {Number(stat.value).toLocaleString('ko-KR')}{' '}
                        <span className="text-sm font-bold not-italic ml-0.5 opacity-50">
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-slate-200">
                <Table>
                  <TableHeader className="bg-[#8da0cd]">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter min-w-[220px]">
                        자재
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[120px] text-right">
                        생산수량
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[140px] whitespace-nowrap">
                        생산일
                      </TableHead>
                      <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter min-w-[260px]">
                        메모
                      </TableHead>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                  {(() => {
                    const total = (shipments as any[]).reduce(
                      (acc, s) => acc + Number((s as any)?.total_amount || 0),
                      0
                    )
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

                    const stats = [
                      { label: '출고건수', value: count, unit: '건' },
                      { label: '금액', value: total, unit: '원' },
                      { label: '진행', value: pending, unit: '건' },
                      { label: '완료', value: completed, unit: '건' },
                    ]

                    return stats.map((stat, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100 shadow-sm"
                      >
                        <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
                          {stat.label}
                        </div>
                        <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
                          {Number(stat.value).toLocaleString('ko-KR')}{' '}
                          <span className="text-sm font-bold not-italic ml-0.5 opacity-50">
                            {stat.unit}
                          </span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}

              {/* Per-site summary bar */}
              {Array.isArray(shipments) && shipments.length > 0 && (
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max">
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
                            <div
                              key={site}
                              className="rounded-2xl border bg-white p-4 shadow-sm border-slate-100 min-w-[200px]"
                            >
                              <div className="text-[10px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30 mb-1">
                                {site}
                              </div>
                              <div className="flex items-baseline justify-between">
                                <div className="text-xl font-black text-[#1A254F] italic tracking-tight">
                                  {Math.round(v.total).toLocaleString('ko-KR')}
                                  <span className="text-xs font-bold not-italic ml-0.5 opacity-40">
                                    원
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-slate-400">{v.count}건</div>
                              </div>
                            </div>
                          )
                        })
                    })()}
                  </div>
                </div>
              )}
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-slate-200">
                <ShipmentsTable shipments={shipments as any} />
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-6">
              {/* Section: 품목 관리 (요약) */}
              <section className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#1A254F] tracking-tight">
                        품목 관리
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        자재 코드/명/단위 등 기준 정보를 관리합니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/admin/materials/settings/materials/new"
                      className={cn(
                        buttonVariants({ variant: 'primary', size: 'compact' }),
                        'h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 whitespace-nowrap'
                      )}
                    >
                      새 품목 등록
                    </Link>
                    <Link
                      href="/dashboard/admin/materials/settings/materials"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 whitespace-nowrap'
                      )}
                    >
                      전체 관리
                    </Link>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left">
                        <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter w-[140px]">
                          코드
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                          품명
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter w-[120px]">
                          단위
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter w-[80px]">
                          사용여부
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(materialsData || []).length === 0 ? (
                        <tr>
                          <td
                            className="px-4 py-10 text-center text-slate-400 font-medium"
                            colSpan={4}
                          >
                            등록된 품목이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        (materialsData || []).map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-[11px] text-blue-600 font-bold">
                              {m.code || '-'}
                            </td>
                            <td className="px-4 py-3 font-bold text-[#1A254F]">{m.name}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">
                              {m.unit || '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {m.is_active ? (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] rounded-lg h-5 px-1.5 shadow-none">
                                  사용
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[10px] rounded-lg h-5 px-1.5 shadow-none">
                                  중지
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section: 결제/배송/운임 방식 */}
              <section className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#1A254F] tracking-tight">
                        결제 및 배송 방식
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        청구/배송/운임 결제 기준 정보를 관리합니다.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/admin/materials/settings/payment-methods"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 whitespace-nowrap'
                    )}
                  >
                    옵션 상세 관리
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {(['billing', 'shipping', 'freight'] as const).map(cat => (
                    <div
                      key={cat}
                      className="rounded-2xl border bg-slate-50/50 p-5 border-slate-100"
                    >
                      <div className="mb-4 text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
                        {cat === 'billing'
                          ? '청구 방식'
                          : cat === 'shipping'
                            ? '배송 수단'
                            : '운임 지불'}
                      </div>
                      <ul className="space-y-2">
                        {(paymentByCategory[cat] || []).length === 0 ? (
                          <li className="text-xs text-slate-400 font-medium">등록된 항목 없음</li>
                        ) : (
                          (paymentByCategory[cat] || []).slice(0, 10).map(item => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-100/50"
                            >
                              <span className="text-sm font-bold text-[#1A254F]">{item.name}</span>
                              <span
                                className={cn(
                                  'text-[10px] font-black uppercase tracking-tighter',
                                  item.is_active ? 'text-blue-600' : 'text-slate-300'
                                )}
                              >
                                {item.is_active ? '활성' : '비활성'}
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
              <section className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#1A254F] tracking-tight">
                        자재 거래처 관리
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        자재 공급 및 판매처 기준 정보를 관리합니다.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/admin/partners"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 whitespace-nowrap'
                    )}
                  >
                    거래처 통합 관리
                  </Link>
                </div>
                <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left">
                        <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                          업체명
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter w-[120px] text-center">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partnersPreview.length === 0 ? (
                        <tr>
                          <td
                            className="px-4 py-10 text-center text-slate-400 font-medium"
                            colSpan={2}
                          >
                            등록된 거래업체가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        partnersPreview.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 font-bold text-[#1A254F]">{p.company_name}</td>
                            <td className="px-4 py-3 text-center">
                              {p.status === 'active' ? (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] rounded-lg h-5 px-1.5 shadow-none">
                                  활성
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[10px] rounded-lg h-5 px-1.5 shadow-none">
                                  비활성
                                </Badge>
                              )}
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
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <div className="text-[11px] font-black uppercase tracking-tighter text-slate-400">
              총 <span className="text-[#1A254F]">{total}</span> 건 · {page} / {pages} 페이지
            </div>
            <div className="flex gap-2">
              <Link
                href={buildQuery({ page: String(Math.max(1, page - 1)) })}
                className={cn(
                  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 h-10 text-sm font-bold text-slate-600 transition-all',
                  page <= 1
                    ? 'opacity-30 pointer-events-none'
                    : 'hover:bg-slate-50 hover:text-[#1A254F] hover:border-slate-300'
                )}
              >
                이전 페이지
              </Link>
              <Link
                href={buildQuery({ page: String(Math.min(pages, page + 1)) })}
                className={cn(
                  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 h-10 text-sm font-bold text-slate-600 transition-all',
                  page >= pages
                    ? 'opacity-30 pointer-events-none'
                    : 'hover:bg-slate-50 hover:text-[#1A254F] hover:border-slate-300'
                )}
              >
                다음 페이지
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
