import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import type { OptionItem } from '@/modules/mobile/components/production/SelectField'
import { ProductionSearchSection } from '@/modules/mobile/components/production/ProductionSearchSection'

export const metadata: Metadata = { title: '생산정보 관리' }

export default async function ProductionManagePage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    period?: string
    site_id?: string
    partner_company_id?: string
    material_id?: string
    take?: string
  }
}) {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  // 입력 폼은 별도 페이지로 분리됨

  // 1.1 자재별 월간통계: 현재 월 기준 생산/출고 합계, 재고(월간증감) = 생산-출고
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startISO = startOfMonth.toISOString()

  const { data: monthlyProd } = await supabase
    .from('material_productions')
    .select('material_id, produced_quantity, materials(name)')
    .gte('production_date', startISO)
    .limit(10000)

  const { data: monthlyShipments } = await supabase
    .from('material_shipments')
    .select('id, shipment_date, shipment_items(material_id, quantity)')
    .gte('shipment_date', startISO)
    .limit(5000)

  // 요약 통계 (이번 달)
  const totalProducedThisMonth = (monthlyProd || []).reduce(
    (sum: number, row: any) => sum + Number(row.produced_quantity || 0),
    0
  )
  const totalShippedThisMonth = (monthlyShipments || []).reduce((sum: number, ship: any) => {
    const items = ship.shipment_items || []
    return sum + items.reduce((acc: number, it: any) => acc + Number(it.quantity || 0), 0)
  }, 0)
  const netChangeThisMonth = totalProducedThisMonth - totalShippedThisMonth

  // 최근 생산기록 100건 (검색어 적용)
  const { data: productionsRaw } = await supabase
    .from('material_productions')
    .select(
      'id, site_id, material_id, production_date, produced_quantity, quality_status, quality_notes, sites(name), materials(name, code)'
    )
    .order('production_date', { ascending: false })
    .limit(200)

  // Search filters (mirroring 요청 검색)
  const q = (searchParams?.q || '').trim()
  const filterPeriod = (searchParams?.period || '').trim()
  const siteIdRaw = (searchParams?.site_id || '').trim()
  const partnerCompanyIdRaw = (searchParams?.partner_company_id || '').trim()
  const materialIdRaw = (searchParams?.material_id || '').trim()

  const selectedSiteId = siteIdRaw && siteIdRaw !== 'all' ? siteIdRaw : ''
  const selectedPartnerCompanyId =
    partnerCompanyIdRaw && partnerCompanyIdRaw !== 'all' ? partnerCompanyIdRaw : ''
  const selectedMaterialId = materialIdRaw && materialIdRaw !== 'all' ? materialIdRaw : ''
  const takeParam = (searchParams?.take || '').trim()
  const take = Math.max(
    20,
    Math.min(200, Number.isFinite(Number(takeParam)) && takeParam ? parseInt(takeParam, 10) : 20)
  )

  // Load filter options
  const { data: materialRows } = await supabase
    .from('materials')
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })
  const { data: siteRows } = await supabase
    .from('sites')
    .select('id, name, is_deleted')
    .eq('is_deleted', false)
    .order('name', { ascending: true })
  const { data: partnerRows } = await supabase
    .from('partner_companies')
    .select('id, company_name, status')
    .order('company_name', { ascending: true })

  // For partner filter, resolve allowed site ids
  let allowedSites: Set<string> | null = null
  if (selectedPartnerCompanyId) {
    const { data: mappings } = await supabase
      .from('partner_site_mappings')
      .select('site_id')
      .eq('partner_company_id', selectedPartnerCompanyId)
    allowedSites = new Set(((mappings || []) as any[]).map(m => String((m as any).site_id)))
  }

  // Period range from filter (YYYY-MM)
  let periodStartISO: string | null = null
  let periodEndISO: string | null = null
  if (/^\d{4}-\d{2}$/.test(filterPeriod)) {
    const [yy, mm] = filterPeriod.split('-').map(Number)
    const s = new Date(Date.UTC(yy, mm - 1, 1))
    const e = new Date(Date.UTC(yy, mm, 1))
    periodStartISO = s.toISOString()
    periodEndISO = e.toISOString()
  }

  // Apply filters in memory (dataset limited to 100)
  const productions = (productionsRaw || []).filter((p: any) => {
    if (q) {
      const lower = q.toLowerCase()
      const inMaterial = String(p.materials?.name || '')
        .toLowerCase()
        .includes(lower)
      const inSite = String(p.sites?.name || '')
        .toLowerCase()
        .includes(lower)
      if (!(inMaterial || inSite)) return false
    }
    if (periodStartISO && periodEndISO) {
      const d = p.production_date ? new Date(p.production_date) : null
      if (!d || !(d >= new Date(periodStartISO) && d < new Date(periodEndISO))) return false
    }
    if (selectedSiteId && String(p.site_id) !== selectedSiteId) return false
    if (selectedMaterialId && String(p.material_id) !== selectedMaterialId) return false
    if (allowedSites && !allowedSites.has(String(p.site_id))) return false
    return true
  })

  const visibleProductions = productions.slice(0, take)

  // Build next link (preserve filters)
  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (filterPeriod) baseParams.set('period', filterPeriod)
  if (siteIdRaw) baseParams.set('site_id', siteIdRaw)
  if (partnerCompanyIdRaw) baseParams.set('partner_company_id', partnerCompanyIdRaw)
  if (materialIdRaw) baseParams.set('material_id', materialIdRaw)
  const baseQuery = baseParams.toString()
  const nextTake = Math.min(take + 20, 200)

  // Build partner name map by site (first active mapping)
  const siteIdsForPartner = Array.from(
    new Set((productions || []).map((p: any) => p.site_id).filter(Boolean))
  ) as string[]
  const partnerBySite = new Map<string, string>()
  if (siteIdsForPartner.length > 0) {
    const { data: mappings } = await supabase
      .from('partner_site_mappings')
      .select('site_id, partner_companies(company_name)')
      .in('site_id', siteIdsForPartner)
      .eq('is_active', true)
    ;(mappings || []).forEach((m: any) => {
      const name = m.partner_companies?.company_name || ''
      if (m.site_id && name && !partnerBySite.has(String(m.site_id))) {
        partnerBySite.set(String(m.site_id), name)
      }
    })
  }

  // Build Select options
  const materialOptions: OptionItem[] = [
    { value: 'all', label: '전체 자재' },
    ...(materialRows || []).map(m => ({
      value: String((m as any).id),
      label: String((m as any).name || '-'),
    })),
  ]
  const siteOptions: OptionItem[] = [
    { value: 'all', label: '전체 현장' },
    ...(siteRows || []).map(s => ({
      value: String((s as any).id),
      label: String((s as any).name || '-'),
    })),
  ]
  const partnerOptions: OptionItem[] = [
    { value: 'all', label: '전체 거래처' },
    ...(partnerRows || []).map(p => ({
      value: String((p as any).id),
      label: String((p as any).company_name || '-'),
    })),
  ]

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="production" />}>
      <div className="p-5 space-y-5">
        {/* 1.1 이번달 생산판매 */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">이번달 생산판매</div>
            <Link href="/mobile/production/production/new" className="ml-auto">
              <button type="button" className="pm-pill-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-1.5"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                새 등록
              </button>
            </Link>
          </div>
          {/* 월간 요약 통계카드 (섹션 내부에 포함) */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="pm-kpi">
              <div className="pm-kpi-label">생산량</div>
              <div className="pm-kpi-value">{totalProducedThisMonth.toLocaleString()}</div>
            </div>
            <div className="pm-kpi pm-kpi--sales">
              <div className="pm-kpi-label">출고량</div>
              <div className="pm-kpi-value">{totalShippedThisMonth.toLocaleString()}</div>
            </div>
            <div className="pm-kpi pm-kpi--stock">
              <div className="pm-kpi-label">순증량</div>
              <div className="pm-kpi-value">{netChangeThisMonth.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* 1.2 생산 검색 (요청 검색과 동일한 구성, 접기 기본) */}
        <ProductionSearchSection
          materialOptions={materialOptions}
          siteOptions={siteOptions}
          partnerOptions={partnerOptions}
          defaultPeriod={filterPeriod}
          defaultMaterialId={materialIdRaw || 'all'}
          defaultSiteId={siteIdRaw || 'all'}
          defaultPartnerCompanyId={partnerCompanyIdRaw || 'all'}
          defaultKeyword={q}
        />

        {/* 1.2 생산등록 이력 리스트 */}

        {/* 1.3 생산 리스트 조회 */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">생산 리스트</div>
            {/* 생산 검색 섹션에서 이미 검색 폼을 제공하므로 여기서는 제거 */}
          </div>
          {(!productions || productions.length === 0) && (
            <div className="text-sm text-muted-foreground">생산 리스트가 없습니다.</div>
          )}
          <div className="space-y-3">
            {(visibleProductions || []).map((p: any) => {
              const siteText = p.sites?.name || '-'
              const partnerName = partnerBySite.get(String(p.site_id)) || '-'
              const dateText = p.production_date
                ? new Date(p.production_date).toLocaleDateString('ko-KR')
                : '-'
              const qty = p.produced_quantity ?? 0
              const materialText = `${p.materials?.name || '-'}${p.materials?.code ? ` (${p.materials.code})` : ''}`
              let memo: string | null = null
              if (p.quality_notes) {
                const qn = String(p.quality_notes)
                // Try to extract memo from JSON if present; else show raw
                try {
                  const obj = JSON.parse(qn)
                  memo = obj?.memo || null
                } catch {
                  // If quality_notes contains a combined note + JSON, show the first line as memo
                  memo = qn.split('\n')[0] || null
                }
              }
              return (
                <div key={p.id} className="block rounded-lg border p-4 bg-white">
                  {/* Top row: Site and Quantity (match 요청 리스트 style) */}
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
                      <div className="text-sm text-muted-foreground">생산수량</div>
                      <div className="text-2xl font-bold leading-none">{qty}</div>
                    </div>
                  </div>

                  {/* Material */}
                  <div className="mt-2 text-base">
                    <span className="text-muted-foreground">자재</span>:{' '}
                    <span className="font-semibold">{materialText}</span>
                  </div>

                  {/* Memo */}
                  {memo && (
                    <div className="mt-2 text-sm text-muted-foreground truncate">메모: {memo}</div>
                  )}
                </div>
              )
            })}
            {productions.length > take && (
              <div className="mt-4 flex justify-center">
                <a
                  href={`/mobile/production/production?${baseQuery}${baseQuery ? '&' : ''}take=${nextTake}`}
                  className="close-btn"
                >
                  더보기
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Removed bottom 생산등록 버튼 — moved to 섹션 헤더 */}
      </div>
    </MobileLayoutWithAuth>
  )
}
