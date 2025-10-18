import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import { QuantityStepper } from '@/modules/mobile/components/production/QuantityStepper'
import { SelectField, type OptionItem } from '@/modules/mobile/components/production/SelectField'

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
  const supabase = (await import('@/lib/supabase/server')).createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id = (formData.get('site_id') as string) || ''
  const material_id = (formData.get('material_id') as string) || ''
  const shipment_date = (formData.get('shipment_date') as string) || ''
  const quantity = Number(formData.get('quantity') || 0)
  const carrier = ((formData.get('carrier') as string) || '').trim() || null
  const tracking_number = ((formData.get('tracking_number') as string) || '').trim() || null
  const amount_net = Number(formData.get('amount_net') || 0)
  const billing_method_id = ((formData.get('billing_method_id') as string) || '').trim() || null
  const shipping_method_id = ((formData.get('shipping_method_id') as string) || '').trim() || null
  const freight_charge_method_id =
    ((formData.get('freight_charge_method_id') as string) || '').trim() || null
  const status = ((formData.get('status') as string) || '').trim() || undefined

  if (!site_id || !material_id || !shipment_date || quantity <= 0) {
    redirect(`/mobile/production/shipping-payment/${encodeURIComponent(id)}/edit`)
  }

  const total_amount = Math.max(0, Math.round(amount_net || 0))

  await supabase
    .from('material_shipments')
    .update({
      site_id,
      shipment_date,
      carrier,
      tracking_number,
      billing_method_id,
      shipping_method_id,
      freight_charge_method_id,
      total_amount,
      status,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', id)

  // Upsert first shipment item (single-item UI)
  const { data: existingItems } = await supabase
    .from('shipment_items')
    .select('id')
    .eq('shipment_id', id)
    .order('created_at', { ascending: true })

  if (existingItems && existingItems.length > 0) {
    const firstId = (existingItems[0] as any).id
    await supabase
      .from('shipment_items')
      .update({ material_id, quantity } as any)
      .eq('id', firstId)
  } else {
    await supabase.from('shipment_items').insert({
      shipment_id: id,
      material_id,
      quantity,
      unit_price: null,
      total_price: null,
    } as any)
  }

  ;(await import('next/cache')).revalidatePath('/mobile/production/shipping-payment')
  redirect('/mobile/production/shipping-payment')
}

export default async function ShippingEditPage({ params }: { params: { id: string } }) {
  await requireAuth('/mobile/production')
  const supabase = createClient()
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
          shipment_items(id, material_id, quantity, materials(name, code)),
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
          'id, site_id, shipment_date, status, shipment_items(id, material_id, quantity), sites(name)'
        )
        .eq('id', id)
        .maybeSingle()
      shipment = basic
    }
  } catch {
    const { data: basic } = await supabase
      .from('material_shipments')
      .select(
        'id, site_id, shipment_date, status, shipment_items(id, material_id, quantity), sites(name)'
      )
      .eq('id', id)
      .maybeSingle()
    shipment = basic
  }

  const { data: sites } = await supabase.from('sites').select('id, name').order('name')
  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')
  const { data: partners } = await supabase
    .from('partner_companies')
    .select('id, company_name, status')
    .order('company_name', { ascending: true })

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

  const firstItem = Array.isArray((shipment as any)?.shipment_items)
    ? (shipment as any)?.shipment_items?.[0]
    : null
  const defaultMaterialId = firstItem?.material_id ? String(firstItem.material_id) : ''
  const defaultQuantity = Number(firstItem?.quantity || 0)

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">출고 수정 입력</div>
            <p className="text-[#31A3FA] font-semibold text-base">필수입력(*)후 저장</p>
          </div>
          <form action={updateShipment.bind(null, id)} className="pm-form pm-form--dense space-y-3">
            {/* 1. 제품명 - 자재선택 (1행1열) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">제품명</label>
              <SelectField
                name="material_id"
                required
                options={(materials || []).map(m => ({
                  value: m.id,
                  label: `${m.name}${m.code ? ` (${m.code})` : ''}`,
                }))}
                defaultValue={defaultMaterialId}
                placeholder="자재 선택"
              />
            </div>

            {/* 2. 출고날짜 + 출고수량 (1행2열) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  출고일<span className="req-mark"> *</span>
                </label>
                <input
                  type="date"
                  name="shipment_date"
                  className="w-full rounded border px-3 py-2"
                  defaultValue={
                    (shipment as any)?.shipment_date
                      ? String((shipment as any).shipment_date).slice(0, 10)
                      : ''
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  출고수량<span className="req-mark"> *</span>
                </label>
                <QuantityStepper name="quantity" step={10} min={0} defaultValue={defaultQuantity} />
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
                defaultValue={String((shipment as any)?.site_id || '')}
                placeholder="현장 선택"
              />
            </div>

            <input type="hidden" name="carrier" value={(shipment as any)?.carrier || ''} />

            {/* 4. 거래처 선택 (1행1열) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">거래처 선택</label>
              <SelectField
                name="partner_company_id"
                options={(partners || []).map(p => ({
                  value: (p as any).id,
                  label: (p as any).company_name,
                }))}
                placeholder="거래처 선택"
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
                  defaultValue={Number((shipment as any)?.total_amount || 0)}
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
                  defaultValue={String((shipment as any)?.status || 'preparing')}
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
                  defaultValue={String(
                    (shipment as any)?.billing_method?.id || billingOptions[0]?.value || ''
                  )}
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
                  defaultValue={String(
                    (shipment as any)?.shipping_method?.id || shippingOptions[0]?.value || ''
                  )}
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
                  defaultValue={String(
                    (shipment as any)?.freight_method?.id || freightOptions[0]?.value || ''
                  )}
                  placeholder="선택"
                  required
                />
              </div>
            </div>

            {/* 7~8. 결제 옵션 (2행2열) */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-0">
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_etax"
                  defaultChecked={Boolean((shipment as any)?.flag_etax)}
                />{' '}
                <span>전자세금계산서</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_statement"
                  defaultChecked={Boolean((shipment as any)?.flag_statement)}
                />{' '}
                <span>거래명세서</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_freight_paid"
                  defaultChecked={Boolean((shipment as any)?.flag_freight_paid)}
                />{' '}
                <span>운임비 지불</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="flag_bill_amount"
                  defaultChecked={Boolean((shipment as any)?.flag_bill_amount)}
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
