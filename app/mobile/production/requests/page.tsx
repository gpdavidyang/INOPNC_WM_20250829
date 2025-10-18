import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
// Avoid importing client-only types in this server file
type OptionItem = { value: string; label: string }
import { SelectField } from '@/modules/mobile/components/production/SelectField'
import dynamic from 'next/dynamic'
const RequestDetailFromQuery = dynamic(
  () => import('@/modules/mobile/components/production/RequestDetailFromQuery'),
  { ssr: false }
)
const ScrollUnlock = dynamic(() => import('@/modules/mobile/components/util/ScrollUnlock'), {
  ssr: false,
})

export const metadata: Metadata = { title: '주문요청 조회' }

export default async function ProductionRequestsPage({
  searchParams,
}: {
  searchParams?: {
    period?: string // YYYY-MM
    site?: string
    site_id?: string
    partner?: string
    partner_company_id?: string
    q?: string
    material_id?: string
    page?: string
    page_size?: string
  }
}) {
  await requireAuth('/mobile/production')
  // Use service-role client to ensure production manager screen can aggregate across all sites/partners regardless of RLS.
  // This page runs on the server; credentials are not exposed to the client.
  const supabase = createServiceRoleClient()

  // Filters
  const period = (searchParams?.period || '').trim() // YYYY-MM
  const siteQuery = (searchParams?.site || '').trim()
  const siteIdFilterRaw = (searchParams?.site_id || '').trim()
  const partnerQuery = (searchParams?.partner || '').trim()
  const partnerCompanyIdFilterRaw = (searchParams?.partner_company_id || '').trim()
  const keyword = (searchParams?.q || '').trim()
  const materialIdRaw = (searchParams?.material_id || '').trim()
  const pageParam = (searchParams?.page || '').trim()
  const pageSizeParam = (searchParams?.page_size || '').trim()

  // Normalize 'all' sentinel from CustomSelect to empty string for filtering
  const selectedSiteId = siteIdFilterRaw && siteIdFilterRaw !== 'all' ? siteIdFilterRaw : ''
  const selectedPartnerCompanyId =
    partnerCompanyIdFilterRaw && partnerCompanyIdFilterRaw !== 'all'
      ? partnerCompanyIdFilterRaw
      : ''
  const selectedMaterialId = materialIdRaw && materialIdRaw !== 'all' ? materialIdRaw : ''
  const page = Math.max(1, Number.parseInt(pageParam || '1') || 1)
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(pageSizeParam || '20') || 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize // inclusive to fetch pageSize+1 rows for hasMore check

  // This month range (UTC)
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const monthStartISO = monthStart.toISOString()
  const monthEndISO = monthEnd.toISOString()

  // Load materials for filter select
  const { data: materialRows } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Load sites for filter select
  const { data: siteRows } = await supabase
    .from('sites')
    .select('id, name, is_deleted')
    .eq('is_deleted', false)
    .order('name', { ascending: true })

  // Load partner companies for filter select
  const { data: partnerRows } = await supabase
    .from('partner_companies')
    .select('id, company_name, status')
    .order('company_name', { ascending: true })

  // Build base query for requests
  let query = supabase
    .from('material_requests')
    .select(
      `
      id,
      site_id,
      requested_by,
      request_number,
      status,
      created_at,
      notes
    `
    )
    .order('created_at', { ascending: false })

  // Period filter (YYYY-MM) -> created_at within month (robust against missing request_date)
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split('-').map(n => Number(n))
    const start = new Date(Date.UTC(y, m - 1, 1))
    const end = new Date(Date.UTC(y, m, 1))
    const startISO = start.toISOString()
    const endISO = end.toISOString()
    query = query.gte('created_at', startISO).lt('created_at', endISO)
  }
  // Server-side site filter for performance
  if (selectedSiteId) {
    query = query.eq('site_id', selectedSiteId)
  }
  // Pagination window
  query = query.range(from, to)

  // Execute
  const { data: rawRequests, error: reqError } = await query
  if (reqError) {
    console.error('[production/requests] primary query error:', reqError)
  }

  const requestsAll = (rawRequests || []) as Array<any>
  const hasMore = requestsAll.length > pageSize
  const requests = hasMore ? requestsAll.slice(0, pageSize) : requestsAll

  // Load site names for display (avoid join to prevent embed failures)
  const siteIdSet = Array.from(
    new Set((requests || []).map(r => r.site_id).filter(Boolean))
  ) as string[]
  let siteNameMap: Record<string, string> = {}
  if (siteIdSet.length > 0) {
    const { data: siteRows2, error: siteNameErr } = await supabase
      .from('sites')
      .select('id, name')
      .in('id', siteIdSet)
    if (!siteNameErr) {
      siteNameMap = Object.fromEntries(
        (siteRows2 || []).map((s: any) => [s.id as string, (s.name as string) || '-'])
      )
    }
  }

  // Load partner(company) name via requested_by -> profiles.partner_company_id -> partner_companies.company_name
  const userIds = Array.from(
    new Set((requests || []).map(r => r.requested_by).filter(Boolean))
  ) as string[]
  let userPartnerNameMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profRows } = await supabase
      .from('profiles')
      .select('id, partner_company_id')
      .in('id', userIds)
    const partnerIds = Array.from(
      new Set((profRows || []).map((p: any) => p.partner_company_id).filter(Boolean))
    ) as string[]
    let partnerNameById: Record<string, string> = {}
    if (partnerIds.length > 0) {
      const { data: pcRows } = await supabase
        .from('partner_companies')
        .select('id, company_name')
        .in('id', partnerIds)
      partnerNameById = Object.fromEntries(
        (pcRows || []).map((p: any) => [p.id as string, (p.company_name as string) || '-'])
      )
    }
    userPartnerNameMap = Object.fromEntries(
      (profRows || []).map((p: any) => [
        p.id as string,
        partnerNameById[p.partner_company_id as string] || '-',
      ])
    )
  }

  // Load items to compute quantities per request and support keyword match on material names
  const reqIds = (requests || []).map(r => r.id)
  let qtyMap: Record<string, number> = {}
  let itemMatIdsByReq: Record<string, string[]> = {}
  let materialNameMap: Record<string, string> = {}
  if (reqIds.length > 0) {
    const { data: itemRows, error: itemErr } = await supabase
      .from('material_request_items')
      .select('request_id, requested_quantity, material_id')
      .in('request_id', reqIds)
    if (!itemErr) {
      const rows = itemRows || []
      qtyMap = rows.reduce((acc: Record<string, number>, row: any) => {
        const rid = row.request_id as string
        acc[rid] = (acc[rid] || 0) + (Number(row.requested_quantity) || 0)
        return acc
      }, {})
      // Map request -> material ids
      itemMatIdsByReq = rows.reduce((acc: Record<string, string[]>, row: any) => {
        const rid = row.request_id as string
        const mid = row.material_id as string
        if (!acc[rid]) acc[rid] = []
        if (mid) acc[rid].push(mid)
        return acc
      }, {})
      // Fetch material names for keyword match (name or code)
      const uniqueMatIds = Array.from(
        new Set(rows.map((r: any) => r.material_id).filter(Boolean))
      ) as string[]
      if (uniqueMatIds.length > 0) {
        const { data: mats } = await supabase
          .from('materials')
          .select('id, name, code')
          .in('id', uniqueMatIds)
        materialNameMap = Object.fromEntries(
          (mats || []).map((m: any) => [m.id as string, `${m.name || ''} ${m.code || ''}`.trim()])
        )
      }
    }
  }

  // Partner company names skipped for robustness (can be re-added once RLS policies are applied in DB)
  let partnerMap: Record<string, string> = {}

  const hasActiveFilter = Boolean(
    (period && /^\d{4}-\d{2}$/.test(period)) ||
      selectedSiteId ||
      selectedPartnerCompanyId ||
      selectedMaterialId ||
      keyword
  )

  // Apply filters in memory (dataset limited to 100); if no filters, show all
  const filtered = hasActiveFilter
    ? requests.filter(rq => {
        // site by id filter
        if (selectedSiteId) {
          if ((rq.site_id as string) !== selectedSiteId) return false
        }
        // material filter (skipped: items not embedded)
        if (selectedMaterialId) {
          // optional: server-side filter by joining items
        }
        // text site filter removed (UI uses select)
        // partner/company name filter skipped (no requester join)
        // partner by id filter
        if (selectedPartnerCompanyId) {
          // no requester join → cannot filter by partner id
        }
        // keyword search (request_number, notes, site name, material names/codes)
        if (keyword) {
          const lower = keyword.toLowerCase()
          const inRequestNo = String(rq.request_number || '')
            .toLowerCase()
            .includes(lower)
          const inNotes = String(rq.notes || '')
            .toLowerCase()
            .includes(lower)
          const inSite = String(siteNameMap[rq.site_id] || '')
            .toLowerCase()
            .includes(lower)
          const matIds = itemMatIdsByReq[rq.id] || []
          const inMaterials = matIds.some(mid =>
            (materialNameMap[mid] || '').toLowerCase().includes(lower)
          )
          if (!(inRequestNo || inNotes || inSite || inMaterials)) return false
        }
        return true
      })
    : requests

  // Safety fallback: if filters resulted in empty but data exists, show unfiltered
  const finalList = filtered.length === 0 && requests.length > 0 ? requests : filtered
  // Build base query string for detail links
  const baseParams = new URLSearchParams()
  if (period) baseParams.set('period', period)
  if (siteIdFilterRaw) baseParams.set('site_id', siteIdFilterRaw)
  if (partnerCompanyIdFilterRaw) baseParams.set('partner_company_id', partnerCompanyIdFilterRaw)
  if (materialIdRaw) baseParams.set('material_id', materialIdRaw)
  if (keyword) baseParams.set('q', keyword)
  const baseQuery = baseParams.toString()
  const requestIdOpen = (searchParams?.request_id || '').trim?.() || ''
  const nextParams = new URLSearchParams(baseQuery)
  nextParams.set('page', String(page + 1))
  nextParams.set('page_size', String(pageSize))
  const nextHref = `/mobile/production/requests?${nextParams.toString()}`

  // Build next page link preserving filters

  const materials = (materialRows || []).map(m => ({
    id: m.id as string,
    name: (m.name as string) || '-',
  }))
  const siteOptions: OptionItem[] = [
    { value: 'all', label: '전체 현장' },
    ...(siteRows || []).map(s => ({ value: s.id as string, label: (s.name as string) || '-' })),
  ]
  const partnerOptions: OptionItem[] = [
    { value: 'all', label: '전체 거래처' },
    ...(partnerRows || []).map(p => ({
      value: p.id as string,
      label: (p.company_name as string) || '-',
    })),
  ]
  const materialOptions: OptionItem[] = [
    { value: 'all', label: '전체 자재' },
    ...materials.map(m => ({ value: m.id, label: m.name })),
  ]

  // This month stats (no joins; fetch requests then items by id)
  const { data: monthRequests } = await supabase
    .from('material_requests')
    .select('id, site_id, created_at')
    .gte('created_at', monthStartISO)
    .lt('created_at', monthEndISO)

  const monthRequestCount = (monthRequests || []).length
  const monthUniqueSiteCount = new Set(
    (monthRequests || []).map((r: any) => r.site_id as string).filter(Boolean)
  ).size

  let monthTotalRequestedQty = 0
  if (monthRequests && monthRequests.length > 0) {
    const monthReqIds = monthRequests.map((r: any) => r.id)
    const { data: monthItemRows } = await supabase
      .from('material_request_items')
      .select('request_id, requested_quantity')
      .in('request_id', monthReqIds)
    monthTotalRequestedQty = (monthItemRows || []).reduce(
      (sum: number, it: any) => sum + (Number(it.requested_quantity) || 0),
      0
    )
  }

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="requests" />}>
      <div className="p-5 space-y-4">
        <ScrollUnlock />
        {/* 이번달 주문 요약 */}
        <div className="rounded-lg border p-4 bg-white">
          {/* Dashboard cards (this month only) */}
          <div className="pm-section-title mb-3">이번달 주문</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="pm-kpi">
              <div className="pm-kpi-label">주문 건수</div>
              <div className="pm-kpi-value">{monthRequestCount ?? 0}</div>
            </div>
            <div className="pm-kpi pm-kpi--sales">
              <div className="pm-kpi-label">주문현장 수</div>
              <div className="pm-kpi-value">{monthUniqueSiteCount}</div>
            </div>
            <div className="pm-kpi pm-kpi--stock">
              <div className="pm-kpi-label">주문수량</div>
              <div className="pm-kpi-value">{monthTotalRequestedQty}</div>
            </div>
          </div>
        </div>

        {/* 주문 검색 (접기/펼치기) */}
        <div className="rounded-lg border bg-white">
          <details>
            <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
              <span className="pm-section-title">주문 검색</span>
              <span className="pm-toggle-link">
                <span className="toggle-closed">펼치기</span>
                <span className="toggle-open">접기</span>
              </span>
            </summary>
            <div className="px-4 pb-4">
              <form className="pm-form space-y-3" method="get">
                <input type="hidden" name="page" value="1" />
                <input type="hidden" name="page_size" value={String(pageSize)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">기간 (년월)</label>
                    <input
                      type="month"
                      name="period"
                      defaultValue={period || ''}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">자재선택</label>
                    <SelectField
                      name="material_id"
                      options={materialOptions}
                      defaultValue={materialIdRaw || 'all'}
                      placeholder="자재 선택"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">현장 선택</label>
                    <SelectField
                      name="site_id"
                      options={siteOptions}
                      defaultValue={siteIdFilterRaw || 'all'}
                      placeholder="현장 선택"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">거래처 선택</label>
                    <SelectField
                      name="partner_company_id"
                      options={partnerOptions}
                      defaultValue={partnerCompanyIdFilterRaw || 'all'}
                      placeholder="거래처 선택"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">검색어</label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={keyword}
                    placeholder="검색어를 입력하세요"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div className="pm-form-actions">
                  <a href="/mobile/production/requests" className="pm-btn pm-btn-secondary">
                    초기화
                  </a>
                  <button type="submit" className="pm-btn pm-btn-primary">
                    검색
                  </button>
                </div>
              </form>
            </div>
          </details>
        </div>

        {/* 주문 리스트 */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="pm-section-title mb-3">주문 리스트</div>
          {finalList.length === 0 ? (
            <div className="text-sm text-muted-foreground">요청이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {finalList.map(rq => {
                const qty = qtyMap[rq.id] || 0
                const displayDate = (rq.created_at as string) || ''
                const dateText = displayDate
                  ? new Date(displayDate).toLocaleDateString('ko-KR')
                  : '-'
                const siteText = siteNameMap[rq.site_id] || '-'
                const matIds = itemMatIdsByReq[rq.id] || []
                const matNames = matIds.map(mid => materialNameMap[mid] || '').filter(Boolean)
                const matSummary =
                  matNames.length === 0
                    ? '-'
                    : matNames.length === 1
                      ? matNames[0]
                      : `${matNames[0]} 외 ${matNames.length - 1}건`

                const href = `/mobile/production/requests?${baseQuery}${baseQuery ? '&' : ''}request_id=${rq.id}`
                const partnerName = userPartnerNameMap[rq.requested_by as string] || '-'
                return (
                  <a key={rq.id} href={href} className="block rounded-lg border p-4 bg-white">
                    {/* Top row: Site and Quantity */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-3">
                        <div className="text-lg font-bold truncate">{siteText}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground truncate">
                          거래처 {partnerName}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-700">
                            {dateText}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-muted-foreground">총 주문수량</div>
                        <div className="text-2xl font-bold leading-none">{qty}</div>
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="mt-2 text-base">
                      <span className="text-muted-foreground">자재</span>:{' '}
                      <span className="font-semibold">{matSummary}</span>
                    </div>

                    {/* Notes */}
                    {rq.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">메모: {rq.notes}</div>
                    )}
                  </a>
                )
              })}
            </div>
          )}
          {finalList.length > 0 && hasMore && (
            <div className="mt-3 flex justify-center">
              <a href={nextHref} className="close-btn">
                더 보기
              </a>
            </div>
          )}
        </div>
        <RequestDetailFromQuery />
      </div>
    </MobileLayoutWithAuth>
  )
}
