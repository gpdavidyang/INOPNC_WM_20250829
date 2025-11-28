import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import ShipmentItemsFieldArray from '@/modules/mobile/components/production/ShipmentItemsFieldArray'
import ShipmentAmountInput from '@/modules/mobile/components/production/ShipmentAmountInput'
import { SelectField, OptionItem } from '@/modules/mobile/components/production/SelectField'
import MaterialPartnerSelect from '@/modules/mobile/components/production/MaterialPartnerSelect'
import { buildMaterialPartnerOptions } from '@/modules/mobile/utils/material-partners'
import { loadMaterialPartnerRows } from '@/modules/mobile/services/material-partner-service'
import {
  parseShipmentItems,
  legacyShipmentItems,
  missingShipmentColumns,
  OPTIONAL_COLUMN_KEYS,
  resolveSiteForPartner,
  buildMetadataSnapshot,
  encodeMetadataSnapshot,
  insertShipmentItems,
  extractMissingColumnName,
  type SnapshotItemNote,
} from '@/modules/mobile/utils/shipping-form'

export const metadata: Metadata = { title: '출고 등록' }

type PaymentCategory = 'billing' | 'shipping' | 'freight'

function decodeLegacyName(raw: string): { category: PaymentCategory; name: string } {
  const markerIndex = raw.indexOf('::')
  if (markerIndex > 0) {
    const prefix = raw.slice(0, markerIndex).toLowerCase() as PaymentCategory
    const label = raw.slice(markerIndex + 2)
    if (prefix === 'billing' || prefix === 'shipping' || prefix === 'freight') {
      return { category: prefix, name: label }
    }
  }
  const LEGACY_DEFAULT: Record<string, PaymentCategory> = {
    즉시청구: 'billing',
    월말청구: 'billing',
    택배: 'shipping',
    화물: 'shipping',
    직접: 'shipping',
    선불: 'freight',
    착불: 'freight',
  }
  const inferred = LEGACY_DEFAULT[raw] ?? 'billing'
  return { category: inferred, name: raw }
}

function buildShipmentNumber(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const suffix = Math.random().toString(36).slice(-5).toUpperCase()
  return `MS-${yyyy}${mm}${dd}-${suffix}`
}

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id_raw = ((formData.get('site_id') as string) || '').trim() || null
  const shipment_date = (formData.get('shipment_date') as string) || ''
  const carrier = ((formData.get('carrier') as string) || '').trim() || null
  const tracking_number = ((formData.get('tracking_number') as string) || '').trim() || null
  const amount_net = Number(formData.get('amount_net') || 0)
  const partner_company_id = ((formData.get('partner_company_id') as string) || '').trim() || null
  const partner_company_label =
    ((formData.get('partner_company_id_label') as string) || '').trim() || ''
  const billing_method_id = ((formData.get('billing_method_id') as string) || '').trim() || null
  const billing_method_label = ((formData.get('billing_method_label') as string) || '').trim() || ''
  const shipping_method_id = ((formData.get('shipping_method_id') as string) || '').trim() || null
  const shipping_method_label =
    ((formData.get('shipping_method_label') as string) || '').trim() || ''
  const freight_charge_method_id =
    ((formData.get('freight_charge_method_id') as string) || '').trim() || null
  const freight_charge_method_label =
    ((formData.get('freight_charge_method_label') as string) || '').trim() || ''
  const status = ((formData.get('status') as string) || '').trim() || 'preparing'
  const parseCheckbox = (name: string) => formData.get(name) === 'on'
  const flag_etax = parseCheckbox('flag_etax')
  const flag_statement = parseCheckbox('flag_statement')
  const flag_freight_paid = parseCheckbox('flag_freight_paid')
  const flag_bill_amount = parseCheckbox('flag_bill_amount')

  const items = parseShipmentItems(formData)
  const fallbackItems =
    items.length === 0 && Number(formData.get('quantity') || 0) > 0
      ? legacyShipmentItems(formData)
      : []
  const effectiveItems = items.length ? items : fallbackItems
  const noteEntriesRaw = effectiveItems
    .map(item => ({
      material_id: item.material_id || '',
      material_label: (item.material_label || '').trim(),
      note: (item.notes || '').trim(),
    }))
    .filter(entry => entry.note)
  let itemNotesForSnapshot: SnapshotItemNote[] = []
  const partnerColumnUnavailable = missingShipmentColumns.has('partner_company_id')
  let resolvedSiteId: string | null = site_id_raw
  let siteWasAutofilled = false
  if (!resolvedSiteId && partner_company_id && partnerColumnUnavailable) {
    resolvedSiteId = await resolveSiteForPartner(supabase, partner_company_id)
    siteWasAutofilled = Boolean(resolvedSiteId)
  }
  const hasSite = Boolean(resolvedSiteId)
  const hasPartner = Boolean(partner_company_id)
  const partnerCanSatisfyRequirement = hasPartner && !partnerColumnUnavailable

  if (!hasSite && !partnerCanSatisfyRequirement) {
    if (partnerColumnUnavailable && hasPartner) {
      throw new Error(
        '현재 환경에서는 현장을 함께 선택해야 합니다. 현장을 지정한 뒤 다시 시도해 주세요.'
      )
    }
    throw new Error('현장명 또는 자재거래처 중 하나를 선택해 주세요.')
  }

  if (!shipment_date || effectiveItems.length === 0) {
    console.error('[ShippingCreate] validation failed', {
      site_id: resolvedSiteId,
      partner_company_id,
      shipment_date,
      itemsLength: effectiveItems.length,
    })
    throw new Error('필수 항목을 입력해 주세요.')
  }

  const derivedTotal = effectiveItems.reduce((sum, item) => {
    const qty = Number(item.quantity || 0)
    const unit = Number(item.unit_price || 0)
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum
    return sum + qty * unit
  }, 0)
  const total_amount = Math.max(0, Math.round(derivedTotal > 0 ? derivedTotal : amount_net || 0))
  if (noteEntriesRaw.length > 0) {
    itemNotesForSnapshot = noteEntriesRaw.map(entry => ({
      material_id: entry.material_id || undefined,
      material_label: entry.material_label || undefined,
      note: entry.note,
    }))
  }

  const nowISO = new Date().toISOString()
  const optionalFieldValues: Partial<
    Record<OptionalShipmentColumn, string | number | boolean | null>
  > = {
    created_by: session.user.id,
    created_at: nowISO,
    updated_at: nowISO,
    carrier,
    tracking_number,
    shipment_number: buildShipmentNumber(),
    partner_company_id,
    billing_method_id,
    shipping_method_id,
    freight_charge_method_id,
    total_amount,
    flag_etax,
    flag_statement,
    flag_freight_paid,
    flag_bill_amount,
  }
  const billingLabel = billing_method_label
  const shippingLabel = shipping_method_label
  const freightLabel = freight_charge_method_label
  const buildPayload = (omit: Set<OptionalShipmentColumn>) => {
    const payload: Record<string, any> = {
      site_id: resolvedSiteId,
      shipment_date,
      status,
    }
    for (const key of OPTIONAL_COLUMN_KEYS) {
      if (omit.has(key)) continue
      if (!(key in optionalFieldValues)) continue
      const value = optionalFieldValues[key]
      if (typeof value === 'undefined') continue
      payload[key] = value
    }
    const metadataSnapshot = encodeMetadataSnapshot(
      buildMetadataSnapshot({
        omit,
        partnerLabel: partner_company_label,
        totalAmount: total_amount,
        flags: {
          flag_etax,
          flag_statement,
          flag_freight_paid,
          flag_bill_amount,
        },
        siteAutofilled: siteWasAutofilled,
        billingLabel,
        shippingLabel,
        freightLabel,
        itemNotes: itemNotesForSnapshot,
      })
    )
    if (metadataSnapshot) {
      payload.notes = metadataSnapshot
    }
    return payload
  }
  const detectedMissing = new Set<OptionalShipmentColumn>(missingShipmentColumns)
  let shipment: { id: string } | null = null
  let shipmentError: any = null
  // Attempt insert while gracefully dropping columns not supported by the current schema.
  for (let attempt = 0; attempt < OPTIONAL_COLUMN_KEYS.length + 1; attempt++) {
    const payload = buildPayload(detectedMissing)
    const result = await supabase
      .from('material_shipments')
      .insert(payload as any)
      .select('id')
      .single()
    if (!result.error && result.data) {
      shipment = result.data as { id: string }
      break
    }
    shipmentError = result.error
    const missingColumn = extractMissingColumnName(shipmentError)
    if (missingColumn && OPTIONAL_COLUMN_KEYS.includes(missingColumn)) {
      console.warn('[ShippingCreate] Missing column detected, retrying without field', {
        missingColumn,
        message: shipmentError?.message,
      })
      if (missingColumn === 'partner_company_id' && !resolvedSiteId && partner_company_id) {
        resolvedSiteId = await resolveSiteForPartner(supabase, partner_company_id)
        if (!resolvedSiteId) {
          throw new Error(
            '현재 환경에서는 현장을 함께 선택해야 합니다. 현장을 지정한 뒤 다시 시도해 주세요.'
          )
        }
        siteWasAutofilled = true
      }
      detectedMissing.add(missingColumn)
      missingShipmentColumns.add(missingColumn)
      continue
    }
    break
  }

  if (!shipment) {
    console.error('[ShippingCreate] insert error', shipmentError)
    throw new Error('출고 정보를 저장하지 못했습니다.')
  }

  if (shipment.id && effectiveItems.length > 0) {
    await insertShipmentItems(supabase, shipment.id, effectiveItems)
  }

  revalidatePath('/dashboard/admin/materials?tab=shipments')
  revalidatePath('/mobile/production/shipping-payment')
  redirect('/mobile/production/shipping-payment')
}

export default async function ShippingCreatePage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  const { data: sites } = await supabase.from('sites').select('id, name').order('name')
  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')
  const materialOptions: OptionItem[] = (materials || []).map(m => ({
    value: m.id,
    label: `${m.name}${m.code ? ` (${m.code})` : ''}`,
  }))
  const partnerRows = await loadMaterialPartnerRows('active')
  const materialPartnerOptions = buildMaterialPartnerOptions(partnerRows)

  let billingOptions: OptionItem[] = []
  let shippingOptions: OptionItem[] = []
  let freightOptions: OptionItem[] = []
  const dedupeOptions = (list: OptionItem[]) => {
    const seen = new Set<string>()
    return list.filter(opt => {
      const key = String((opt.label || '').toLowerCase().trim())
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const pickDefaultValue = (options: OptionItem[], preferredLabel: string): string => {
    const preferred = options.find(opt => opt.label === preferredLabel)
    if (preferred) return preferred.value
    return options[0]?.value || ''
  }

  const categories: PaymentCategory[] = ['billing', 'shipping', 'freight']
  const { data: categorized, error: catError } = await supabase
    .from('payment_methods')
    .select('id, name, category, is_active, sort_order')
    .in('category', categories)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!catError && categorized) {
    const sort = (a: any, b: any) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'ko')
    const group = (cat: PaymentCategory) =>
      categorized
        .filter((r: any) => r.category === cat)
        .sort(sort)
        .map((r: any) => ({ value: r.id, label: r.name }))
    billingOptions = dedupeOptions(group('billing'))
    shippingOptions = dedupeOptions(group('shipping'))
    freightOptions = dedupeOptions(group('freight'))
  } else {
    const { data: legacy } = await supabase
      .from('payment_methods')
      .select('id, name, is_active')
      .order('name', { ascending: true })
    if (legacy) {
      const billing: OptionItem[] = []
      const shipping: OptionItem[] = []
      const freight: OptionItem[] = []
      legacy
        .filter((r: any) => r.is_active)
        .forEach((r: any) => {
          const decoded = decodeLegacyName(r.name)
          const item = { value: r.id, label: decoded.name }
          if (decoded.category === 'billing') billing.push(item)
          else if (decoded.category === 'shipping') shipping.push(item)
          else freight.push(item)
        })
      billingOptions = dedupeOptions(billing)
      shippingOptions = dedupeOptions(shipping)
      freightOptions = dedupeOptions(freight)
    }
  }

  const defaultBillingValue = billingOptions.length
    ? pickDefaultValue(billingOptions, '월말청구')
    : ''
  const defaultShippingValue = shippingOptions.length
    ? pickDefaultValue(shippingOptions, '택배')
    : ''
  const defaultFreightValue = freightOptions.length ? pickDefaultValue(freightOptions, '선불') : ''
  const todayISO = new Date().toISOString().slice(0, 10)

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">출고 정보 입력</div>
            <p className="text-[#31A3FA] font-semibold text-base">필수입력(*)후 저장</p>
          </div>
          <form action={submit} className="pm-form pm-form--dense space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr]">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  출고 품목<span className="req-mark"> *</span>
                </label>
                <ShipmentItemsFieldArray materialOptions={materialOptions} />
              </div>
            </div>

            {/* 출고일 + 금액 (1행2열 고정) */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  출고일<span className="req-mark"> *</span>
                </label>
                <input
                  type="date"
                  name="shipment_date"
                  className="w-full rounded-lg border px-3 py-2"
                  defaultValue={todayISO}
                  required
                />
              </div>
              <div>
                <ShipmentAmountInput name="amount_net" />
              </div>
            </div>

            {/* 3. 현장/거래처 (1행2열 고정) */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="min-w-0">
                <label className="block text-sm text-muted-foreground mb-1">현장 선택</label>
                <SelectField
                  name="site_id"
                  options={(sites || []).map(s => ({ value: s.id, label: s.name }))}
                  placeholder="현장 선택"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm text-muted-foreground mb-1">자재거래처</label>
                <MaterialPartnerSelect
                  name="partner_company_id"
                  options={materialPartnerOptions}
                  placeholder="자재거래처 선택"
                />
              </div>
            </div>

            <input type="hidden" name="carrier" value="" />

            {/* 4. 상태/청구/배송/운임 (1행4열) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">상태</label>
                <SelectField
                  name="status"
                  options={[
                    { value: 'preparing', label: '대기' },
                    { value: 'delivered', label: '완료' },
                  ]}
                  placeholder="상태 선택"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">청구방식</label>
                <SelectField
                  name="billing_method_id"
                  labelFieldName="billing_method_label"
                  options={billingOptions}
                  placeholder="청구방식 선택"
                  defaultValue={defaultBillingValue}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">배송방식</label>
                <SelectField
                  name="shipping_method_id"
                  labelFieldName="shipping_method_label"
                  options={shippingOptions}
                  placeholder="배송방식 선택"
                  defaultValue={defaultShippingValue}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">선불/착불</label>
                <SelectField
                  name="freight_charge_method_id"
                  labelFieldName="freight_charge_method_label"
                  options={freightOptions}
                  placeholder="선불/착불 선택"
                  defaultValue={defaultFreightValue}
                />
              </div>
            </div>

            {/* 7~8. 결제 옵션 (2행2열, B행 상단만 축소) */}
            <div className="grid grid-cols-2 gap-x-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" name="flag_etax" /> <span>전자세금계산서</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" name="flag_statement" /> <span>거래명세서</span>
              </label>
              <div className="-mt-0.5 col-span-2 grid grid-cols-2 gap-x-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" name="flag_freight_paid" /> <span>운임비 지불</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" name="flag_bill_amount" /> <span>금액 청구</span>
                </label>
              </div>
            </div>

            {/* 9. 초기화 & 저장 (1행2열) */}
            <div className="pm-form-actions">
              <button type="reset" className="pm-btn pm-btn-secondary">
                초기화
              </button>
              <button type="submit" className="pm-btn pm-btn-primary">
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
