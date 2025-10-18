import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import { QuantityStepper } from '@/modules/mobile/components/production/QuantityStepper'
import { SelectField, OptionItem } from '@/modules/mobile/components/production/SelectField'

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

  if (!site_id || !material_id || !shipment_date || quantity <= 0) {
    redirect('/mobile/production/shipping-payment/new')
  }

  const total_amount = Math.max(0, Math.round(amount_net || 0))

  const { data: shipment } = await supabase
    .from('material_shipments')
    .insert({
      site_id,
      shipment_date,
      status: 'preparing',
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

  if (shipment?.id) {
    await supabase.from('shipment_items').insert({
      shipment_id: shipment.id,
      material_id,
      quantity,
      unit_price: null,
      total_price: null,
    } as any)
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

  let billingOptions: OptionItem[] = []
  let shippingOptions: OptionItem[] = []
  let freightOptions: OptionItem[] = []

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
    billingOptions = group('billing')
    shippingOptions = group('shipping')
    freightOptions = group('freight')
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
      billingOptions = billing
      shippingOptions = shipping
      freightOptions = freight
    }
  }

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm font-medium mb-3">출고 등록</div>
          <form action={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">현장 *</label>
              <SelectField
                name="site_id"
                required
                options={(sites || []).map(s => ({ value: s.id, label: s.name }))}
                placeholder="현장 선택"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">자재 *</label>
              <SelectField
                name="material_id"
                required
                options={(materials || []).map(m => ({
                  value: m.id,
                  label: `${m.name}${m.code ? ` (${m.code})` : ''}`,
                }))}
                placeholder="자재 선택"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">출고수량 *</label>
                <QuantityStepper name="quantity" step={10} min={0} />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">출고일 *</label>
                <input
                  type="date"
                  name="shipment_date"
                  className="w-full rounded border px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="hidden" name="carrier" value="" />
              <div>
                <label className="block text-sm text-muted-foreground mb-1">운송장번호</label>
                <input
                  type="text"
                  name="tracking_number"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">청구방식 *</label>
                <SelectField
                  name="billing_method_id"
                  options={billingOptions}
                  placeholder="선택"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">배송방식 *</label>
                <SelectField
                  name="shipping_method_id"
                  options={shippingOptions}
                  placeholder="선택"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">선불/착불 *</label>
                <SelectField
                  name="freight_charge_method_id"
                  options={freightOptions}
                  placeholder="선택"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">결제금액(KRW)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="amount_net"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded border px-3 py-2 bg-black text-white">
                저장
              </button>
              <button type="reset" className="flex-1 rounded border px-3 py-2">
                초기화
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
