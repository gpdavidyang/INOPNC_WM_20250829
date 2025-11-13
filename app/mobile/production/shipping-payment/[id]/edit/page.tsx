import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import ShipmentItemsFieldArray from '@/modules/mobile/components/production/ShipmentItemsFieldArray'
import ShipmentAmountInput from '@/modules/mobile/components/production/ShipmentAmountInput'
import { SelectField, type OptionItem } from '@/modules/mobile/components/production/SelectField'
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
  parseMetadataSnapshot,
  type OptionalShipmentColumn,
  type SnapshotItemNote,
  type ShipmentItemInput,
} from '@/modules/mobile/utils/shipping-form'

export const metadata: Metadata = { title: '출고 수정 입력' }

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

async function updateShipment(id: string, formData: FormData) {
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
  const partnerColumnUnavailable = missingShipmentColumns.has('partner_company_id')
  let resolvedSiteId = site_id_raw
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
    throw new Error('필수 항목을 입력해 주세요.')
  }

  const derivedTotal = effectiveItems.reduce((sum, item) => {
    const qty = Number(item.quantity || 0)
    const unit = Number(item.unit_price || 0)
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum
    return sum + qty * unit
  }, 0)
  const total_amount = Math.max(0, Math.round(derivedTotal > 0 ? derivedTotal : amount_net || 0))

  const noteEntriesRaw = effectiveItems
    .map(item => ({
      material_id: item.material_id || '',
      material_label: (item.material_label || '').trim(),
      note: (item.notes || '').trim(),
    }))
    .filter(entry => entry.note)
  let itemNotesForSnapshot: SnapshotItemNote[] = []
  if (noteEntriesRaw.length > 0) {
    itemNotesForSnapshot = noteEntriesRaw.map(entry => ({
      material_id: entry.material_id || undefined,
      material_label: entry.material_label || undefined,
      note: entry.note,
    }))
  }

  const optionalFieldValues: Partial<
    Record<OptionalShipmentColumn, string | number | boolean | null | undefined>
  > = {
    partner_company_id,
    billing_method_id,
    shipping_method_id,
    freight_charge_method_id,
    total_amount,
    flag_etax,
    flag_statement,
    flag_freight_paid,
    flag_bill_amount,
    updated_at: new Date().toISOString(),
    carrier,
    tracking_number,
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
  let updateError: any = null
  let updated = false
  for (let attempt = 0; attempt < OPTIONAL_COLUMN_KEYS.length + 1; attempt++) {
    const payload = buildPayload(detectedMissing)
    const { error } = await supabase
      .from('material_shipments')
      .update(payload as any)
      .eq('id', id)
    if (!error) {
      updated = true
      break
    }
    updateError = error
    const missingColumn = extractMissingColumnName(error)
    if (missingColumn && OPTIONAL_COLUMN_KEYS.includes(missingColumn)) {
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

  if (!updated) {
    console.error('[ShippingEdit] update error', updateError)
    throw new Error('출고 정보를 수정하지 못했습니다.')
  }

  const { error: deleteError } = await supabase
    .from('shipment_items')
    .delete()
    .eq('shipment_id', id)
  if (deleteError) {
    console.error('[ShippingEdit] failed to remove existing shipment items', deleteError)
    throw new Error('출고 품목을 갱신하지 못했습니다.')
  }
  if (effectiveItems.length > 0) {
    await insertShipmentItems(supabase, id, effectiveItems)
  }

  revalidatePath('/dashboard/admin/materials?tab=shipments')
  revalidatePath('/mobile/production/shipping-payment')
  redirect('/mobile/production/shipping-payment')
}

export default async function ShippingEditPage({ params }: { params: { id: string } }) {
  console.log('[ShippingEditPage] render start', params?.id)
  await requireAuth('/mobile/production')
  const supabase = createClient()
  let serviceClient: ReturnType<typeof createServiceClient> | null = null
  try {
    serviceClient = createServiceClient()
  } catch (error) {
    console.warn(
      '[ShippingEditPage] service client unavailable, continuing with session client',
      error
    )
  }
  const id = params.id

  // Load shipment with robust fallback (schema-independent)
  let shipment: any = null
  try {
    const { data, error } = await supabase
      .from('material_shipments')
      .select(
        `
          *,
          sites(name),
          shipment_items(id, material_id, quantity, unit_price, notes, materials(name, code)),
          billing_method:payment_methods!material_shipments_billing_method_id_fkey(id, name),
          shipping_method:payment_methods!material_shipments_shipping_method_id_fkey(id, name),
          freight_method:payment_methods!material_shipments_freight_charge_method_id_fkey(id, name)
        `
      )
      .eq('id', id)
      .maybeSingle()
    if (!error && data) {
      shipment = data
    } else {
      const { data: basic } = await supabase
        .from('material_shipments')
        .select(
          'id, site_id, partner_company_id, shipment_date, status, shipment_items(id, material_id, quantity, unit_price, total_price, notes), sites(name)'
        )
        .eq('id', id)
        .maybeSingle()
      shipment = basic
    }
  } catch {
    const { data: basic } = await supabase
      .from('material_shipments')
      .select(
        'id, site_id, partner_company_id, shipment_date, status, shipment_items(id, material_id, quantity, unit_price, total_price, notes), sites(name)'
      )
      .eq('id', id)
      .maybeSingle()
    shipment = basic
  }

  if (!shipment && serviceClient) {
    const relationalSelect = `
      *,
      sites(name),
      shipment_items(id, material_id, quantity, unit_price, total_price, notes, materials(name, code)),
      billing_method:payment_methods!material_shipments_billing_method_id_fkey(id, name),
      shipping_method:payment_methods!material_shipments_shipping_method_id_fkey(id, name),
      freight_method:payment_methods!material_shipments_freight_charge_method_id_fkey(id, name)
    `
    const basicSelect =
      'id, site_id, request_id, status, shipment_date, delivery_date, total_weight, driver_name, driver_phone, notes, shipment_items(id, material_id, quantity, unit_price, total_price, notes), sites(name)'

    let svcShipment: any = null
    try {
      const { data, error } = await serviceClient
        .from('material_shipments')
        .select(relationalSelect)
        .eq('id', id)
        .maybeSingle()
      if (!error && data) {
        svcShipment = data
      } else {
        if (error) {
          console.warn('[ShippingEditPage] service client relational fetch failed', error)
        }
        const { data: basic, error: basicError } = await serviceClient
          .from('material_shipments')
          .select(basicSelect)
          .eq('id', id)
          .maybeSingle()
        if (basic) {
          svcShipment = basic
        } else if (basicError) {
          console.warn('[ShippingEditPage] service client fallback fetch failed', basicError)
        }
      }
    } catch (svcError) {
      console.warn('[ShippingEditPage] service client fetch threw', svcError)
      const { data: basic } = await serviceClient
        .from('material_shipments')
        .select(basicSelect)
        .eq('id', id)
        .maybeSingle()
      svcShipment = basic
    }

    if (svcShipment) {
      shipment = svcShipment
    }
  }

  if (!shipment) {
    console.warn('[ShippingEditPage] shipment not found, redirecting', id)
    redirect('/mobile/production/shipping-payment')
  }

  const metadata = parseMetadataSnapshot((shipment as any)?.notes || null)
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
    // Fallback: legacy naming in name field
    const { data: fallback } = await supabase
      .from('payment_methods')
      .select('id, name, is_active')
      .eq('is_active', true)

    if (fallback) {
      const billing: OptionItem[] = []
      const shipping: OptionItem[] = []
      const freight: OptionItem[] = []
      ;(fallback as any[])
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

  const fallbackBillingValue = billingOptions.length
    ? pickDefaultValue(billingOptions, '월말청구')
    : ''
  const fallbackShippingValue = shippingOptions.length
    ? pickDefaultValue(shippingOptions, '택배')
    : ''
  const fallbackFreightValue = freightOptions.length ? pickDefaultValue(freightOptions, '선불') : ''

  const legacyBillingValue =
    (
      (shipment as any)?.billing_method?.id ||
      (shipment as any)?.billing_method_id ||
      null
    )?.toString() || ''

  const legacyShippingValue =
    (
      (shipment as any)?.shipping_method?.id ||
      (shipment as any)?.shipping_method_id ||
      null
    )?.toString() || ''

  const legacyFreightValue =
    (
      (shipment as any)?.freight_method?.id ||
      (shipment as any)?.freight_charge_method_id ||
      null
    )?.toString() || ''

  const matchOptionByLabel = (options: OptionItem[], label?: string | null) => {
    if (!label) return ''
    const normalized = label.trim().toLowerCase()
    if (!normalized) return ''
    const found = options.find(opt => opt.label.trim().toLowerCase() === normalized)
    return found?.value || ''
  }

  const matchPartnerByLabel = (label?: string | null) => {
    if (!label) return ''
    const normalized = label.trim().toLowerCase()
    if (!normalized) return ''
    const found = materialPartnerOptions.find(opt => opt.label.trim().toLowerCase() === normalized)
    return found?.value || ''
  }

  const defaultPartnerCompanyId =
    String((shipment as any)?.partner_company_id || '') ||
    matchPartnerByLabel(metadata?.partner_company_label)

  const resolvedBillingValue =
    legacyBillingValue ||
    matchOptionByLabel(billingOptions, metadata?.billing_method_label) ||
    fallbackBillingValue

  const resolvedShippingValue =
    legacyShippingValue ||
    matchOptionByLabel(shippingOptions, metadata?.shipping_method_label) ||
    fallbackShippingValue

  const resolvedFreightValue =
    legacyFreightValue ||
    matchOptionByLabel(freightOptions, metadata?.freight_method_label) ||
    fallbackFreightValue

  const metadataNotes = metadata?.item_notes || []
  const metadataNotesByMaterial = new Map<string, SnapshotItemNote>()
  const metadataNotesByLabel = new Map<string, SnapshotItemNote>()
  metadataNotes.forEach(note => {
    if (note.material_id) {
      metadataNotesByMaterial.set(note.material_id, note)
    }
    if (note.material_label) {
      metadataNotesByLabel.set(note.material_label.trim().toLowerCase(), note)
    }
  })

  const shipmentItems: ShipmentItemInput[] = Array.isArray((shipment as any)?.shipment_items)
    ? (((shipment as any)?.shipment_items || [])
        .map((item: any) => {
          const materialId = item?.material_id ? String(item.material_id) : ''
          if (!materialId) return null
          const materialName = item?.materials?.name || ''
          const materialCode = item?.materials?.code || ''
          const formattedLabel = materialName
            ? `${materialName}${materialCode ? ` (${materialCode})` : ''}`
            : metadataNotesByMaterial.get(materialId)?.material_label || ''
          const metadataNote =
            metadataNotesByMaterial.get(materialId) ||
            metadataNotesByLabel.get(formattedLabel.trim().toLowerCase())
          return {
            material_id: materialId,
            material_label: formattedLabel,
            quantity: Number(item?.quantity || 0),
            unit_price: typeof item?.unit_price === 'number' ? Number(item.unit_price) : null,
            notes: typeof item?.notes === 'string' ? item.notes : metadataNote?.note || null,
          }
        })
        .filter(Boolean) as ShipmentItemInput[])
    : []

  const defaultItems = shipmentItems.length
    ? shipmentItems
    : (metadataNotes
        .map(note => {
          if (!note.material_id) return null
          return {
            material_id: note.material_id,
            material_label: note.material_label,
            quantity: 0,
            unit_price: null,
            notes: note.note,
          }
        })
        .filter(Boolean) as ShipmentItemInput[])

  const derivedItemsTotal = defaultItems.reduce((sum, item) => {
    const qty = Number(item.quantity || 0)
    const unit = Number(item.unit_price || 0)
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum
    return sum + qty * unit
  }, 0)

  const defaultAmountNet = (() => {
    const explicit = Number((shipment as any)?.total_amount)
    if (Number.isFinite(explicit) && explicit > 0) return explicit
    const snapshotAmount = Number(metadata?.total_amount_input)
    if (Number.isFinite(snapshotAmount) && snapshotAmount > 0) return snapshotAmount
    return derivedItemsTotal
  })()

  type FlagKey = 'flag_etax' | 'flag_statement' | 'flag_freight_paid' | 'flag_bill_amount'
  const defaultFlag = (key: FlagKey) => {
    if (typeof (shipment as any)?.[key] === 'boolean') return Boolean((shipment as any)?.[key])
    return Boolean(metadata?.flags?.[key])
  }

  const defaultShipmentDate = (shipment as any)?.shipment_date
    ? String((shipment as any)?.shipment_date).slice(0, 10)
    : ''
  const defaultSiteId = String((shipment as any)?.site_id || '')
  const defaultStatus = String((shipment as any)?.status || 'preparing')

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">출고 수정 입력</div>
            <p className="text-[#31A3FA] font-semibold text-base">필수입력(*)후 저장</p>
          </div>
          <form action={updateShipment.bind(null, id)} className="pm-form pm-form--dense space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                출고 품목<span className="req-mark"> *</span>
              </label>
              <ShipmentItemsFieldArray
                materialOptions={materialOptions}
                defaultItems={defaultItems}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  출고일<span className="req-mark"> *</span>
                </label>
                <input
                  type="date"
                  name="shipment_date"
                  className="w-full rounded border px-3 py-2"
                  defaultValue={defaultShipmentDate}
                  required
                />
              </div>
            </div>

            {/* 3. 현장명 선택 (1행1열) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">현장명 선택</label>
              <SelectField
                name="site_id"
                options={(sites || []).map(s => ({ value: s.id, label: s.name }))}
                defaultValue={defaultSiteId}
                placeholder="현장 선택"
              />
            </div>

            <input type="hidden" name="carrier" value={(shipment as any)?.carrier || ''} />
            <input
              type="hidden"
              name="tracking_number"
              value={(shipment as any)?.tracking_number || ''}
            />

            {/* 4. 자재거래처 선택 (1행1열) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">자재거래처</label>
              <MaterialPartnerSelect
                name="partner_company_id"
                options={materialPartnerOptions}
                placeholder="자재거래처 선택"
                defaultValue={defaultPartnerCompanyId}
              />
            </div>

            {/* 5. 출고금액 + 상태 (1행2열) */}
            <div className="grid grid-cols-2 gap-3">
              <ShipmentAmountInput name="amount_net" defaultValue={defaultAmountNet} />
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  상태<span className="req-mark"> *</span>
                </label>
                <SelectField
                  name="status"
                  options={[
                    { value: 'preparing', label: '대기' },
                    { value: 'delivered', label: '완료' },
                  ]}
                  defaultValue={defaultStatus}
                  placeholder="상태 선택"
                  required
                />
              </div>
            </div>

            {/* 6. 청구방식 + 배송방식 + 선불/착불 (1행3열) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  청구방식<span className="req-mark"> *</span>
                </label>
                <SelectField
                  name="billing_method_id"
                  labelFieldName="billing_method_label"
                  options={billingOptions}
                  defaultValue={resolvedBillingValue}
                  placeholder="선택"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  배송방식<span className="req-mark"> *</span>
                </label>
                <SelectField
                  name="shipping_method_id"
                  labelFieldName="shipping_method_label"
                  options={shippingOptions}
                  defaultValue={resolvedShippingValue}
                  placeholder="선택"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  선불/착불<span className="req-mark"> *</span>
                </label>
                <SelectField
                  name="freight_charge_method_id"
                  labelFieldName="freight_charge_method_label"
                  options={freightOptions}
                  defaultValue={resolvedFreightValue}
                  placeholder="선택"
                  required
                />
              </div>
            </div>

            {/* 7~8. 결제 옵션 (2행2열) */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-0">
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" name="flag_etax" defaultChecked={defaultFlag('flag_etax')} />{' '}
                <span>전자세금계산서</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_statement"
                  defaultChecked={defaultFlag('flag_statement')}
                />{' '}
                <span>거래명세서</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_freight_paid"
                  defaultChecked={defaultFlag('flag_freight_paid')}
                />{' '}
                <span>운임비 지불</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_bill_amount"
                  defaultChecked={defaultFlag('flag_bill_amount')}
                />{' '}
                <span>금액 청구</span>
              </label>
            </div>

            {/* 9. 취소 & 저장 (1행2열) */}
            <div className="pm-form-actions">
              <a href="/mobile/production/shipping-payment" className="pm-btn pm-btn-secondary">
                취소
              </a>
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
