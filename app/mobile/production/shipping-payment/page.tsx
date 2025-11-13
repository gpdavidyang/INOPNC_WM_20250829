import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import type { OptionItem } from '@/modules/mobile/components/production/SelectField'
import type { MaterialPartnerOption } from '@/modules/mobile/types/material-partner'
import { ProductionSearchSection } from '@/modules/mobile/components/production/ProductionSearchSection'
import { buildMaterialPartnerOptions } from '@/modules/mobile/utils/material-partners'
import { loadMaterialPartnerRows } from '@/modules/mobile/services/material-partner-service'
import { parseMetadataSnapshot } from '@/modules/mobile/utils/shipping-form'

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
  const missingSelectParts = new Set<ShipmentSelectPart>()
  let selectResolved = false
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from('material_shipments')
      .select(buildShipmentSelectClause(missingSelectParts))
      .order('shipment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) {
      shipmentsRaw = (data as any[]) || []
      selectResolved = true
      break
    }
    const missingParts = getMissingPartsFromError(error)
    if (missingParts.length > 0) {
      missingParts.forEach(part => missingSelectParts.add(part))
      continue
    }
    OPTIONAL_SHIPMENT_SELECT_PARTS.forEach(part => missingSelectParts.add(part))
  }
  if (!selectResolved) {
    shipmentsRaw = shipmentsRaw || []
  }
  const partnerColumnAvailable = !missingSelectParts.has('partner')
  const totalColumnAvailable = !missingSelectParts.has('total')
  const flagsAvailable = !missingSelectParts.has('flags')

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

  const shipmentPartnerIds = partnerColumnAvailable
    ? (Array.from(
        new Set(
          ((shipmentsRaw || []) as any[])
            .map((s: any) => s.partner_company_id)
            .filter((id: any) => typeof id === 'string' && id.length > 0)
        )
      ) as string[])
    : []
  const partnerNameById = new Map<string, string>()
  if (shipmentPartnerIds.length > 0) {
    const { data: partnerNameRows } = await supabase
      .from('partner_companies')
      .select('id, company_name')
      .in('id', shipmentPartnerIds)
    ;(partnerNameRows || []).forEach((row: any) => {
      if (row?.id) {
        partnerNameById.set(String(row.id), row.company_name || '-')
      }
    })
  }

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
  const selectedPartnerLabel =
    !partnerColumnAvailable && selectedPartnerCompanyId
      ? partnerOptions.find(opt => opt.value === selectedPartnerCompanyId)?.label || ''
      : ''

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
    allowedSites = new Set(
      ((mappings || []) as any[]).map(m => String((m as any).site_id || '')).filter(Boolean)
    )
  }

  // Apply filters in memory
  const shipments = (shipmentsRaw || []).filter((s: any) => {
    const metadata = (s as any).__meta || parseMetadataSnapshot((s as any)?.notes || null) || null
    ;(s as any).__meta = metadata
    if (q) {
      const lower = q.toLowerCase()
      const site = String(s.sites?.name || '').toLowerCase()
      const mappedPartner =
        s.site_id && partnerBySite.has(String(s.site_id))
          ? String(partnerBySite.get(String(s.site_id)) || '').toLowerCase()
          : ''
      const directPartner =
        partnerColumnAvailable &&
        s.partner_company_id &&
        partnerNameById.has(String(s.partner_company_id))
          ? String(partnerNameById.get(String(s.partner_company_id)) || '').toLowerCase()
          : ''
      const metadataPartner = metadata?.partner_company_label
        ? metadata.partner_company_label.toLowerCase()
        : ''
      const matchKeyword =
        site.includes(lower) ||
        mappedPartner.includes(lower) ||
        directPartner.includes(lower) ||
        metadataPartner.includes(lower)
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
    if (selectedPartnerCompanyId) {
      if (partnerColumnAvailable) {
        const matchesDirect = String(s.partner_company_id || '') === selectedPartnerCompanyId
        const matchesMapped = s.site_id ? Boolean(allowedSites?.has(String(s.site_id))) : false
        if (!matchesDirect && !matchesMapped) return false
      } else if (selectedPartnerLabel) {
        const matchesMetadata = metadata?.partner_company_label === selectedPartnerLabel
        const matchesMapped = s.site_id ? Boolean(allowedSites?.has(String(s.site_id))) : false
        if (!matchesMetadata && !matchesMapped) return false
      }
    }
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
  const totalAmountThisMonth = monthlyShipments.reduce((acc: number, s: any) => {
    const metadata = parseMetadataSnapshot((s as any)?.notes || null)
    const storedAmount = totalColumnAvailable
      ? Number((s as any)?.total_amount || 0)
      : metadata?.total_amount_input || 0
    if (storedAmount > 0) return acc + storedAmount
    const items = Array.isArray(s.shipment_items) ? s.shipment_items : []
    const derived = items.reduce((sum: number, it: any) => {
      const totalPrice = Number((it as any)?.total_price || 0)
      if (totalPrice > 0) return sum + totalPrice
      const qty = Number(it.quantity || 0)
      const unitPrice = Number((it as any)?.unit_price || 0)
      if (qty > 0 && unitPrice > 0) return sum + qty * unitPrice
      return sum
    }, 0)
    return acc + Math.max(0, derived)
  }, 0)

  async function toggleShipmentStatus(formData: FormData) {
    'use server'
    const supabase = createClient()
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
    const supabase = createClient()
    let admin: ReturnType<typeof createServiceClient> | null = null
    try {
      admin = createServiceClient()
    } catch (error) {
      console.error(
        '[ShippingDelete] Unable to create service client, falling back to session client',
        error
      )
    }
    const db = admin ?? supabase
    const id = (formData.get('shipment_id') as string) || ''
    if (!id) return
    const deleteByShipmentId = async (
      table: string,
      column: string = 'shipment_id'
    ): Promise<void> => {
      const { error } = await db.from(table).delete().eq(column, id)
      if (!error || error.code === 'PGRST116') return
      const code = String(error.code || '')
      const message = String(error.message || '').toLowerCase()
      const mentionsMissing =
        message.includes('does not exist') ||
        message.includes('unknown') ||
        message.includes('missing')
      const isMissingColumn =
        code === '42703' ||
        code === '42P01' ||
        code === 'PGRST204' ||
        (mentionsMissing && (message.includes('column') || message.includes('relation')))
      if (isMissingColumn) {
        console.warn('[ShippingDelete] Skipping delete due to missing schema part', {
          table,
          column,
          message: error.message,
        })
        return
      }
      const isPermissionDenied =
        code === '42501' ||
        code === 'PGRST401' ||
        code === 'PGRST403' ||
        message.includes('permission denied')
      if (isPermissionDenied) {
        console.warn('[ShippingDelete] Skipping delete due to insufficient permissions', {
          table,
          column,
          message: error.message,
        })
        return
      }
      throw error
    }
    const deleteTasks: Array<Promise<void>> = [
      deleteByShipmentId('material_payments'),
      deleteByShipmentId('shipment_items'),
    ]
    try {
      await Promise.all(deleteTasks)
      const { error: shipmentError } = await db.from('material_shipments').delete().eq('id', id)
      if (shipmentError) throw shipmentError
    } catch (error) {
      console.error('[ShippingDelete] Failed to delete shipment', { shipmentId: id, error })
      return
    }
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
              const metadata = (s as any).__meta ?? parseMetadataSnapshot((s as any)?.notes || null)
              const items = Array.isArray(s.shipment_items) ? s.shipment_items : []
              const totalQty = items.reduce(
                (acc: number, it: any) => acc + Number(it.quantity || 0),
                0
              )
              const derivedAmount = items.reduce((acc: number, it: any) => {
                const totalPrice = Number((it as any)?.total_price || 0)
                if (totalPrice > 0) return acc + totalPrice
                const qty = Number(it.quantity || 0)
                const unitPrice = Number((it as any)?.unit_price || 0)
                if (qty > 0 && unitPrice > 0) return acc + qty * unitPrice
                return acc
              }, 0)
              const storedTotalAmount = totalColumnAvailable
                ? Number((s as any)?.total_amount || 0)
                : metadata?.total_amount_input || 0
              const totalAmount =
                storedTotalAmount > 0 ? storedTotalAmount : Math.max(0, derivedAmount)
              const sanitize = (name: string) => name.replace(/\s*\([^)]*\)\s*$/g, '').trim()
              const mats = items
                .map((it: any) => sanitize(String(it.materials?.name || '')))
                .filter(Boolean)
              const matSummary =
                mats.length === 0
                  ? '-'
                  : mats.length === 1
                    ? mats[0]
                    : `${mats[0]} 외 ${mats.length - 1}건`
              const itemNoteLines: string[] = []
              const noteKeys = new Set<string>()
              const pushNote = (text: string) => {
                const trimmed = text.trim()
                if (!trimmed) return
                if (noteKeys.has(trimmed)) return
                noteKeys.add(trimmed)
                itemNoteLines.push(trimmed)
              }
              items.forEach((it: any) => {
                const text = typeof it.notes === 'string' ? it.notes.trim() : ''
                pushNote(text)
              })
              if (metadata?.item_notes?.length) {
                metadata.item_notes.forEach(entry => {
                  const text = typeof entry.note === 'string' ? entry.note : ''
                  pushNote(text)
                })
              }
              const isCompleted = ['shipped', 'delivered'].includes(
                String(s.status || '').toLowerCase()
              )
              const nextStatus = isCompleted ? 'preparing' : 'delivered'
              const partnerName =
                (partnerColumnAvailable &&
                  s.partner_company_id &&
                  partnerNameById.get(String(s.partner_company_id))) ||
                metadata?.partner_company_label ||
                (s.site_id ? partnerBySite.get(String(s.site_id)) : '') ||
                ''
              const siteName = metadata?.site_autofilled ? '' : s.sites?.name || ''
              const title = partnerName || siteName || '-'
              const dateText = s.shipment_date
                ? new Date(s.shipment_date).toLocaleDateString('ko-KR')
                : '-'
              const billingName =
                (s as any)?.billing_method?.name || metadata?.billing_method_label || '-'
              const shippingName =
                (s as any)?.shipping_method?.name || metadata?.shipping_method_label || '-'
              const freightName =
                (s as any)?.freight_method?.name || metadata?.freight_method_label || '-'
              const flagEtax = flagsAvailable
                ? Boolean((s as any)?.flag_etax)
                : Boolean(metadata?.flags?.flag_etax)
              const flagStatement = flagsAvailable
                ? Boolean((s as any)?.flag_statement)
                : Boolean(metadata?.flags?.flag_statement)
              const flagFreightPaid = flagsAvailable
                ? Boolean((s as any)?.flag_freight_paid)
                : Boolean(metadata?.flags?.flag_freight_paid)
              const flagBillAmount = flagsAvailable
                ? Boolean((s as any)?.flag_bill_amount)
                : Boolean(metadata?.flags?.flag_bill_amount)
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
                          거래처: {partnerName}
                        </div>
                      )}
                      {siteName && (!partnerName || partnerName !== siteName) && (
                        <div className="text-sm text-muted-foreground truncate">
                          현장: {siteName}
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
                  {itemNoteLines.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      메모: {itemNoteLines.join(' / ')}
                    </div>
                  )}
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

type ShipmentSelectPart =
  | 'partner'
  | 'total'
  | 'billing'
  | 'shipping'
  | 'freight'
  | 'payments'
  | 'flags'
  | 'itemNotes'
const OPTIONAL_SHIPMENT_SELECT_PARTS: ShipmentSelectPart[] = [
  'partner',
  'total',
  'billing',
  'shipping',
  'freight',
  'payments',
  'flags',
  'itemNotes',
]

function buildShipmentSelectClause(missingParts: Set<ShipmentSelectPart>): string {
  const baseFields = ['id', 'site_id', 'created_at']
  if (!missingParts.has('partner')) baseFields.push('partner_company_id')
  baseFields.push('shipment_date', 'status', 'notes')
  if (!missingParts.has('total')) baseFields.push('total_amount')
  if (!missingParts.has('flags')) {
    baseFields.push('flag_etax', 'flag_statement', 'flag_freight_paid', 'flag_bill_amount')
  }

  const relations = ['sites(name)']
  const itemFields = ['quantity', 'unit_price', 'total_price', 'material_id']
  if (!missingParts.has('itemNotes')) {
    itemFields.push('notes')
  }
  itemFields.push('materials(name, code)')
  relations.push(`shipment_items(${itemFields.join(', ')})`)
  if (!missingParts.has('billing')) {
    relations.push('billing_method:payment_methods!material_shipments_billing_method_id_fkey(name)')
  }
  if (!missingParts.has('shipping')) {
    relations.push(
      'shipping_method:payment_methods!material_shipments_shipping_method_id_fkey(name)'
    )
  }
  if (!missingParts.has('freight')) {
    relations.push(
      'freight_method:payment_methods!material_shipments_freight_charge_method_id_fkey(name)'
    )
  }
  if (!missingParts.has('payments')) {
    relations.push('payments:material_payments(amount)')
  }

  const selectParts = [...baseFields, ...relations]
  return `
        ${selectParts.join(',\n        ')}
      `
}

function getMissingPartsFromError(error: any): ShipmentSelectPart[] {
  if (!error) return []
  const message = String(error.message || '').toLowerCase()
  const parts: ShipmentSelectPart[] = []
  if (message.includes('partner_company_id')) parts.push('partner')
  if (message.includes('total_amount')) parts.push('total')
  if (message.includes('billing_method_id')) parts.push('billing')
  if (message.includes('shipping_method_id')) parts.push('shipping')
  if (message.includes('freight_charge_method_id')) parts.push('freight')
  if (
    message.includes('flag_etax') ||
    message.includes('flag_statement') ||
    message.includes('flag_freight_paid') ||
    message.includes('flag_bill_amount')
  ) {
    parts.push('flags')
  }
  if (message.includes('payment_methods')) parts.push('billing', 'shipping', 'freight')
  if (message.includes('material_payments')) parts.push('payments')
  if (
    message.includes('shipment_items') &&
    message.includes('notes') &&
    (message.includes('column') || message.includes('does not exist'))
  ) {
    parts.push('itemNotes')
  }
  return parts
}
