import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import ShipmentItemsFieldArray from '@/modules/mobile/components/production/ShipmentItemsFieldArray'
import { SelectField, OptionItem } from '@/modules/mobile/components/production/SelectField'
import MaterialPartnerSelect from '@/modules/mobile/components/production/MaterialPartnerSelect'
import { buildMaterialPartnerOptions } from '@/modules/mobile/utils/material-partners'
import { loadMaterialPartnerRows } from '@/modules/mobile/services/material-partner-service'

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

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id = (formData.get('site_id') as string) || ''
  const shipment_date = (formData.get('shipment_date') as string) || ''
  const carrier = ((formData.get('carrier') as string) || '').trim() || null
  const tracking_number = ((formData.get('tracking_number') as string) || '').trim() || null
  const amount_net = Number(formData.get('amount_net') || 0)
  const billing_method_id = ((formData.get('billing_method_id') as string) || '').trim() || null
  const shipping_method_id = ((formData.get('shipping_method_id') as string) || '').trim() || null
  const freight_charge_method_id =
    ((formData.get('freight_charge_method_id') as string) || '').trim() || null
  const status = ((formData.get('status') as string) || '').trim() || 'preparing'

  const items = parseShipmentItems(formData)
  const fallbackItems =
    items.length === 0 && Number(formData.get('quantity') || 0) > 0
      ? legacyShipmentItems(formData)
      : []
  const effectiveItems = items.length ? items : fallbackItems

  if (!site_id || !shipment_date || effectiveItems.length === 0) {
    console.error('[ShippingCreate] validation failed', {
      site_id,
      shipment_date,
      itemsLength: effectiveItems.length,
    })
    throw new Error('필수 항목을 입력해 주세요.')
  }

  const total_amount = Math.max(0, Math.round(amount_net || 0))

  const { data: shipment, error: shipmentError } = await supabase
    .from('material_shipments')
    .insert({
      site_id,
      shipment_date,
      status,
      carrier,
      tracking_number,
      billing_method_id,
      shipping_method_id,
      freight_charge_method_id,
      total_amount,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .select('id')
    .single()

  if (shipmentError || !shipment) {
    console.error('[ShippingCreate] insert error', shipmentError)
    throw new Error('출고 정보를 저장하지 못했습니다.')
  }

  if (shipment.id) {
    const { error: itemsError } = await supabase.from('shipment_items').insert(
      effectiveItems.map(item => ({
        shipment_id: shipment.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price:
          item.unit_price != null ? Number(item.unit_price) * Number(item.quantity || 0) : null,
        notes: item.notes,
      })) as any
    )
    if (itemsError) {
      console.error('[ShippingCreate] item insert error (continuing with fallback)', itemsError)
    }
  }

  revalidatePath('/dashboard/admin/materials?tab=shipments')
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

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">출고 정보 입력</div>
            <p className="text-[#31A3FA] font-semibold text-base">필수입력(*)후 저장</p>
          </div>
          <form action={submit} className="pm-form pm-form--dense space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                출고 품목<span className="req-mark"> *</span>
              </label>
              <ShipmentItemsFieldArray materialOptions={materialOptions} />
            </div>

            {/* 출고날짜 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  출고일<span className="req-mark"> *</span>
                </label>
                <input
                  type="date"
                  name="shipment_date"
                  className="w-full rounded border px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* 3. 현장명 선택 (1행1열) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                현장명 선택<span className="req-mark"> *</span>
              </label>
              <SelectField
                name="site_id"
                required
                options={(sites || []).map(s => ({ value: s.id, label: s.name }))}
                placeholder="현장 선택"
              />
            </div>

            <input type="hidden" name="carrier" value="" />

            {/* 4. 자재거래처 선택 (1행1열) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">자재거래처</label>
              <MaterialPartnerSelect
                name="partner_company_id"
                options={materialPartnerOptions}
                placeholder="자재거래처 선택"
              />
            </div>

            {/* 5. 출고금액 + 상태 (1행2열) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">출고금액(원)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="amount_net"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
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
                  options={billingOptions}
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
                  options={shippingOptions}
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
                  options={freightOptions}
                  placeholder="선택"
                  required
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

type ShipmentItemInput = {
  material_id: string
  quantity: number
  unit_price: number | null
  notes: string | null
}

function parseShipmentItems(formData: FormData): ShipmentItemInput[] {
  const buckets = new Map<number, Record<string, string>>()
  for (const [key, rawValue] of formData.entries()) {
    if (typeof rawValue !== 'string') continue
    const match = key.match(/^items\[(\d+)\]\[(\w+)\]$/)
    if (!match) continue
    const index = Number(match[1])
    const field = match[2]
    if (!buckets.has(index)) buckets.set(index, {})
    buckets.get(index)![field] = rawValue
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, value]) => ({
      material_id: value.material_id || '',
      quantity: Number(value.quantity || 0),
      unit_price: value.unit_price ? Number(value.unit_price) : null,
      notes: value.notes ? value.notes.trim() : null,
    }))
    .filter(item => item.material_id && item.quantity > 0)
}

function legacyShipmentItems(formData: FormData): ShipmentItemInput[] {
  const legacyMaterial = (formData.get('material_id') as string) || ''
  const legacyQty = Number(formData.get('quantity') || 0)
  if (!legacyMaterial || legacyQty <= 0) return []
  return [
    {
      material_id: legacyMaterial,
      quantity: legacyQty,
      unit_price: null,
      notes: null,
    },
  ]
}
