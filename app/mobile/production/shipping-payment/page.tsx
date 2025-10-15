import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

export const metadata: Metadata = { title: '출고·배송·결제 관리' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id = (formData.get('site_id') as string) || ''
  const material_id = (formData.get('material_id') as string) || ''
  const request_id = ((formData.get('request_id') as string) || '').trim() || null
  const shipment_date = (formData.get('shipment_date') as string) || ''
  const quantity = Number(formData.get('quantity') || 0)
  const carrier = ((formData.get('carrier') as string) || '').trim() || null
  const tracking_number = ((formData.get('tracking_number') as string) || '').trim() || null
  const amount_net = Number(formData.get('amount_net') || 0)
  const tax_rate = Number(formData.get('tax_rate') || 10)

  if (!site_id || !material_id || !shipment_date || quantity <= 0) {
    redirect('/mobile/production/shipping-payment')
  }

  const total_amount = Math.round(amount_net * (1 + tax_rate / 100))

  // Create shipment (status: preparing)
  const { data: shipment } = await supabase
    .from('material_shipments')
    .insert({
      site_id,
      request_id,
      shipment_date,
      status: 'preparing',
      carrier,
      tracking_number,
      total_amount,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .select('id')
    .single()

  if (shipment?.id) {
    await supabase
      .from('shipment_items')
      .insert({
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

export default async function ShippingPaymentPage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  const { data: sites } = await supabase.from('sites').select('id, name').order('name')
  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')
  const { data: requests } = await supabase
    .from('material_requests')
    .select('id, request_number, site_id')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <MobileLayoutWithAuth>
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">출고·배송·결제 관리</h1>
          <a href="/mobile/production" className="rounded-md border px-3 py-1.5 text-sm">
            홈으로
          </a>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm font-medium mb-3">출고 등록</div>
          <form action={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">현장 *</label>
              <select name="site_id" className="w-full rounded border px-3 py-2" required>
                <option value="">현장 선택</option>
                {(sites || []).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">요청(선택)</label>
              <select name="request_id" className="w-full rounded border px-3 py-2">
                <option value="">선택 안 함</option>
                {(requests || []).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.request_number || r.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">자재 *</label>
              <select name="material_id" className="w-full rounded border px-3 py-2" required>
                <option value="">자재 선택</option>
                {(materials || []).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.code ? `(${m.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">출고수량 *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="quantity"
                  className="w-full rounded border px-3 py-2"
                  required
                />
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
              <div>
                <label className="block text-sm text-muted-foreground mb-1">배송방식</label>
                <input
                  type="text"
                  name="carrier"
                  placeholder="예: courier/freight"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">운송장번호</label>
                <input
                  type="text"
                  name="tracking_number"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">결제금액(공급가)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="amount_net"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">세율(%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  name="tax_rate"
                  defaultValue={10}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">통화: KRW, 세율 기본 10% (등록만)</div>

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
