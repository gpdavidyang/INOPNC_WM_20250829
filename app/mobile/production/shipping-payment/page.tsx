import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import type { OptionItem } from '@/modules/mobile/components/production/SelectField'
import type { MaterialPartnerOption } from '@/modules/mobile/types/material-partner'
import { ProductionSearchSection } from '@/modules/mobile/components/production/ProductionSearchSection'
import { buildMaterialPartnerOptions } from '@/modules/mobile/utils/material-partners'
import { loadMaterialPartnerRows } from '@/modules/mobile/services/material-partner-service'

export const metadata: Metadata = { title: '출고배송 관리' }

// 입력 폼은 /mobile/production/shipping-payment/new 로 분리됨

export default async function ShippingPaymentPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    period?: string
    material_id?: string
    site_id?: string
    partner_company_id?: string
    status?: string
  }
}) {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  // 최근 출고 이력 (간단 검색 포함)
  let shipmentsRaw: any[] = []
  {
    // Try extended fields first (payment method relations). Fallback to minimal if schema differs.
    const { data: ext, error: extErr } = await supabase
      .from('material_shipments')
      .select(
        `id, site_id, shipment_date, status, total_amount,
         sites(name),
         billing_method:payment_methods!material_shipments_billing_method_id_fkey(name),
         shipping_method:payment_methods!material_shipments_shipping_method_id_fkey(name),
         freight_method:payment_methods!material_shipments_freight_charge_method_id_fkey(name),
         shipment_items(quantity, material_id, materials(name, code)),
         payments:material_payments(amount)`
      )
      .order('shipment_date', { ascending: false })
      .limit(200)
    if (!extErr && ext) {
      shipmentsRaw = ext as any[]
    } else {
      const { data: basic } = await supabase
        .from('material_shipments')
        .select(
          `id, site_id, shipment_date, status, total_amount,
            sites(name),
           shipment_items(quantity, material_id, materials(name, code)),
           payments:material_payments(amount)`
        )
        .order('shipment_date', { ascending: false })
        .limit(200)
      shipmentsRaw = (basic as any[]) || []
    }
  }

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
  const partnerRows = await loadMaterialPartnerRows('active')

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
  const partnerOptions: MaterialPartnerOption[] = buildMaterialPartnerOptions(partnerRows, {
    includeAllOption: true,
    allLabel: '전체 자재거래처',
  })

  const q = (searchParams?.q || '').trim()
  const period = (searchParams?.period || '').trim()
  const selectedMaterialId = (searchParams?.material_id || '').trim() || 'all'
  const siteIdRaw = (searchParams?.site_id || '').trim()
  const partnerCompanyIdRaw = (searchParams?.partner_company_id || '').trim()
  const statusFilter = (searchParams?.status || '').trim() || 'all'
  const takeParam = (searchParams?.take || '').trim()
  const take = Math.max(
    20,
    Math.min(200, Number.isFinite(Number(takeParam)) && takeParam ? parseInt(takeParam, 10) : 20)
  )
  const selectedSiteId = siteIdRaw && siteIdRaw !== 'all' ? siteIdRaw : ''
  const selectedPartnerCompanyId =
    partnerCompanyIdRaw && partnerCompanyIdRaw !== 'all' ? partnerCompanyIdRaw : ''

  let periodStartISO: string | null = null
  let periodEndISO: string | null = null
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [yy, mm] = period.split('-').map(Number)
    const start = new Date(yy, (mm || 1) - 1, 1)
    const end = new Date(yy, mm || 1, 1)
    periodStartISO = start.toISOString()
    periodEndISO = end.toISOString()
  }

  // Partner map for site_id → company_name (for display) and allowedSites (for filter)
  const siteIds = Array.from(
    new Set(((shipmentsRaw || []) as any[]).map((s: any) => s.site_id).filter(Boolean))
  )
  let partnerBySite = new Map<string, string>()
  if (siteIds.length > 0) {
    const { data: mappings } = await supabase
      .from('partner_site_mappings')
      .select('site_id, partner_companies(company_name)')
      .in('site_id', siteIds)
      .eq('is_active', true)
    ;(mappings || []).forEach((m: any) => {
      const name = m.partner_companies?.company_name || ''
      if (m.site_id && name && !partnerBySite.has(String(m.site_id))) {
        partnerBySite.set(String(m.site_id), name)
      }
    })
  }
  // If partner filter selected, compute allowed site ids
  let allowedSites: Set<string> | null = null
  if (selectedPartnerCompanyId) {
    const { data: mappings } = await supabase
      .from('partner_site_mappings')
      .select('site_id')
      .eq('partner_company_id', selectedPartnerCompanyId)
    allowedSites = new Set(((mappings || []) as any[]).map(m => String((m as any).site_id)))
  }

  // Apply filters in memory
  const shipments = (shipmentsRaw || []).filter((s: any) => {
    if (q) {
      const lower = q.toLowerCase()
      const site = String(s.sites?.name || '').toLowerCase()
      const partner = String(partnerBySite.get(String(s.site_id)) || '').toLowerCase()
      const matchKeyword = site.includes(lower) || partner.includes(lower)
      if (!matchKeyword) return false
    }
    if (periodStartISO && periodEndISO) {
      const d = s.shipment_date ? new Date(s.shipment_date) : null
      if (!d || !(d >= new Date(periodStartISO) && d < new Date(periodEndISO))) return false
    }
    if (selectedMaterialId && selectedMaterialId !== 'all') {
      const items = Array.isArray(s.shipment_items) ? s.shipment_items : []
      const hasMaterial = items.some((it: any) => String(it.material_id) === selectedMaterialId)
      if (!hasMaterial) return false
    }
    if (selectedSiteId && String(s.site_id) !== selectedSiteId) return false
    if (allowedSites && !allowedSites.has(String(s.site_id))) return false
    if (statusFilter && statusFilter !== 'all') {
      const st = String(s.status || '').toLowerCase()
      const isCompleted = st === 'shipped' || st === 'delivered'
      if (statusFilter === 'completed' && !isCompleted) return false
      if (statusFilter === 'pending' && isCompleted) return false
    }
    return true
  })
  const visibleShipments = shipments.slice(0, take)

  // Build base query preserving filters
  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (period) baseParams.set('period', period)
  if (siteIdRaw) baseParams.set('site_id', siteIdRaw)
  if (partnerCompanyIdRaw) baseParams.set('partner_company_id', partnerCompanyIdRaw)
  if (selectedMaterialId && selectedMaterialId !== 'all')
    baseParams.set('material_id', selectedMaterialId)
  if (statusFilter && statusFilter !== 'all') baseParams.set('status', statusFilter)
  const baseQuery = baseParams.toString()
  const nextTake = Math.min(take + 20, 200)

  // 요약 통계 (이번 달)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyShipments = (shipmentsRaw || []).filter((s: any) => {
    const d = s.shipment_date ? new Date(s.shipment_date) : null
    return d && d >= startOfMonth
  })
  const totalShipmentsThisMonth = monthlyShipments.length
  const totalQtyThisMonth = monthlyShipments.reduce((acc: number, s: any) => {
    const items = s.shipment_items || []
    return acc + items.reduce((a: number, it: any) => a + Number(it.quantity || 0), 0)
  }, 0)
  const totalAmountThisMonth = monthlyShipments.reduce(
    (acc: number, s: any) => acc + Number((s as any).total_amount || 0),
    0
  )

  async function toggleShipmentStatus(formData: FormData) {
    'use server'
    const supabase = (await import('@/lib/supabase/server')).createClient()
    const id = (formData.get('shipment_id') as string) || ''
    const next = (formData.get('next_status') as string) || ''
    if (!id || !next) return
    await supabase
      .from('material_shipments')
      .update({ status: next } as any)
      .eq('id', id)
    ;(await import('next/cache')).revalidatePath('/mobile/production/shipping-payment')
  }

  async function deleteShipment(formData: FormData) {
    'use server'
    const supabase = (await import('@/lib/supabase/server')).createClient()
    const id = (formData.get('shipment_id') as string) || ''
    if (!id) return
    await supabase.from('shipment_items').delete().eq('shipment_id', id)
    await supabase.from('material_shipments').delete().eq('id', id)
    ;(await import('next/cache')).revalidatePath('/mobile/production/shipping-payment')
  }

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        {/* 2.1 이번달 출고 섹션 */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">이번달 출고</div>
            <Link href="/mobile/production/shipping-payment/new" className="ml-auto">
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
          <div className="grid grid-cols-3 gap-3">
            <div className="pm-kpi">
              <div className="pm-kpi-label">출고건수</div>
              <div className="pm-kpi-value">{totalShipmentsThisMonth.toLocaleString()}</div>
            </div>
            <div className="pm-kpi pm-kpi--sales">
              <div className="pm-kpi-label">출고수량</div>
              <div className="pm-kpi-value">{totalQtyThisMonth.toLocaleString()}</div>
            </div>
            <div className="pm-kpi pm-kpi--stock">
              <div className="pm-kpi-label">출고금액</div>
              <div className="pm-kpi-value">{totalAmountThisMonth.toLocaleString()}원</div>
            </div>
          </div>
        </div>

        {/* 2.2 검색 섹션 (생산 검색과 동일 구성) */}
        <ProductionSearchSection
          title="출고 검색"
          resetHref="/mobile/production/shipping-payment"
          materialOptions={materialOptions}
          siteOptions={siteOptions}
          partnerOptions={partnerOptions}
          defaultPeriod={period}
          defaultMaterialId={selectedMaterialId || 'all'}
          defaultSiteId={siteIdRaw || 'all'}
          defaultPartnerCompanyId={partnerCompanyIdRaw || 'all'}
          defaultKeyword={q}
          includeStatusSelect
          statusLabel="출고상태"
          defaultStatus={statusFilter || 'all'}
        />

        {/* 2.3 출고 리스트 */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">출고 리스트</div>
            {/* 검색 섹션에서 이미 폼 제공 */}
          </div>
          {(!shipments || shipments.length === 0) && (
            <div className="text-sm text-muted-foreground">출고 이력이 없습니다.</div>
          )}
          <div className="space-y-2">
            {(visibleShipments || []).map((s: any) => {
              const totalQty = (s.shipment_items || []).reduce(
                (acc: number, it: any) => acc + Number(it.quantity || 0),
                0
              )
              const totalAmount = Number(s.total_amount || 0)
              const paidAmount = Array.isArray(s.payments)
                ? s.payments.reduce((acc: number, p: any) => acc + Number(p?.amount || 0), 0)
                : 0
              const outstandingAmountRow = Math.max(0, totalAmount - paidAmount)
              const sanitize = (name: string) => name.replace(/\s*\([^)]*\)\s*$/g, '').trim()
              const mats = (s.shipment_items || [])
                .map((it: any) => sanitize(String(it.materials?.name || '')))
                .filter(Boolean)
              const matSummary =
                mats.length === 0
                  ? '-'
                  : mats.length === 1
                    ? mats[0]
                    : `${mats[0]} 외 ${mats.length - 1}건`
              const isCompleted = ['shipped', 'delivered'].includes(
                String(s.status || '').toLowerCase()
              )
              const nextStatus = isCompleted ? 'preparing' : 'delivered'
              const partnerName = partnerBySite.get(String(s.site_id)) || ''
              const dateText = s.shipment_date
                ? new Date(s.shipment_date).toLocaleDateString('ko-KR')
                : '-'
              const title = s.sites?.name || partnerName || '-'
              const billingName = (s as any)?.billing_method?.name || '-'
              const shippingName = (s as any)?.shipping_method?.name || '-'
              const freightName = (s as any)?.freight_method?.name || '-'
              const flagEtax = Boolean((s as any)?.flag_etax)
              const flagStatement = Boolean((s as any)?.flag_statement)
              const flagFreightPaid = Boolean((s as any)?.flag_freight_paid)
              const flagBillAmount = Boolean((s as any)?.flag_bill_amount)
              return (
                <div key={s.id} className="rounded-lg border p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-bold truncate">{title}</div>
                        </div>
                        <form
                          action={toggleShipmentStatus}
                          className="flex-shrink-0 whitespace-nowrap"
                        >
                          <input type="hidden" name="shipment_id" value={s.id} />
                          <input type="hidden" name="next_status" value={nextStatus} />
                          {(() => {
                            const tone = isCompleted
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-amber-300 bg-amber-50 text-amber-700'
                            const label = isCompleted ? '완료' : '대기'
                            return (
                              <button
                                type="submit"
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border whitespace-nowrap font-medium ${tone}`}
                              >
                                {label}
                              </button>
                            )
                          })()}
                        </form>
                      </div>
                      {partnerName && (
                        <div className="mt-0.5 text-sm text-muted-foreground truncate">
                          거래처 {partnerName}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-700">
                          {dateText}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[120px]">
                      <div className="text-sm text-muted-foreground">총 수량</div>
                      <div className="text-2xl font-bold leading-none">
                        {totalQty.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        금액 {totalAmount.toLocaleString()}원
                      </div>
                      <div className="text-xs text-rose-600">
                        미수 {outstandingAmountRow.toLocaleString()}원
                      </div>
                      {(() => {
                        const billing =
                          billingName && billingName !== '-' ? billingName : '즉시청구'
                        const shipping =
                          shippingName && shippingName !== '-' ? shippingName : '택배'
                        const freight = freightName && freightName !== '-' ? freightName : '선불'
                        const pill = (text: string, tone: 'slate' | 'blue' | 'amber' | 'green') => (
                          <span
                            className={
                              `inline-flex items-center justify-center rounded-full px-2 py-0.5 font-medium border text-[11px] ml-1 ` +
                              (tone === 'blue'
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : tone === 'amber'
                                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                                  : tone === 'green'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 bg-slate-50 text-slate-700')
                            }
                          >
                            {text}
                          </span>
                        )
                        const billingTone: 'slate' | 'blue' =
                          billing === '월말청구' ? 'blue' : 'slate'
                        const shippingTone: 'blue' | 'amber' | 'slate' =
                          shipping === '화물' ? 'amber' : shipping === '택배' ? 'blue' : 'slate'
                        const freightTone: 'green' | 'slate' =
                          freight === '선불' ? 'green' : 'slate'
                        return (
                          <div className="mt-2 flex items-center justify-end">
                            {pill(billing, billingTone)}
                            {pill(shipping, shippingTone)}
                            {pill(freight, freightTone)}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="mt-2 text-base">
                    <span className="text-muted-foreground">자재</span>:{' '}
                    <span className="font-semibold">{matSummary}</span>
                  </div>
                  {/* 방식 배지는 상단 우측 총수량 아래로 이동 */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-base">
                    <label className="inline-flex items-center gap-1 justify-start">
                      <input type="checkbox" disabled checked={flagEtax} />{' '}
                      <span>전자세금계산서</span>
                    </label>
                    <label className="inline-flex items-center gap-1 justify-start">
                      <input type="checkbox" disabled checked={flagStatement} />{' '}
                      <span>거래명세서</span>
                    </label>
                    <label className="inline-flex items-center gap-1 justify-start">
                      <input type="checkbox" disabled checked={flagFreightPaid} />{' '}
                      <span>운임지불</span>
                    </label>
                    <label className="inline-flex items-center gap-1 justify-start">
                      <input type="checkbox" disabled checked={flagBillAmount} />{' '}
                      <span>금액 청구</span>
                    </label>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/mobile/production/shipping-payment/${encodeURIComponent(s.id)}/edit`}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      수정
                    </Link>
                    <form action={deleteShipment}>
                      <input type="hidden" name="shipment_id" value={s.id} />
                      <button
                        type="submit"
                        className="rounded border px-2 py-1 text-xs text-red-600"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
          {shipments.length > take && (
            <div className="mt-4 flex justify-center">
              <a
                href={`/mobile/production/shipping-payment?${baseQuery}${baseQuery ? '&' : ''}take=${nextTake}`}
                className="close-btn"
              >
                더보기
              </a>
            </div>
          )}
        </div>

        {/* 2.4 출고등록 버튼은 상단 섹션 헤더로 이동 */}
      </div>
    </MobileLayoutWithAuth>
  )
}
