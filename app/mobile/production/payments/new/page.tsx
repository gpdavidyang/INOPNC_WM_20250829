import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

export const metadata: Metadata = { title: '결제 등록' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const shipment_id = (formData.get('shipment_id') as string) || ''
  const amount = Number(formData.get('amount') || 0)
  const currency = (formData.get('currency') as string) || 'KRW'
  const payment_method_id = ((formData.get('payment_method_id') as string) || '').trim() || null
  const paid_at = (formData.get('paid_at') as string) || null
  const memo = ((formData.get('memo') as string) || '').trim() || null

  if (!shipment_id || amount <= 0) {
    redirect('/mobile/production/payments/new')
  }

  await supabase.from('material_payments').insert({
    shipment_id,
    amount,
    currency,
    payment_method_id,
    tax_rate: null,
    paid_at,
    memo,
  } as any)

  revalidatePath('/dashboard/admin/materials?tab=shipments')
  redirect('/mobile/production')
}

export default async function NewPaymentPage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  const { data: shipments } = await supabase
    .from('material_shipments')
    .select('id, shipment_number, total_amount, sites(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: methods } = await supabase
    .from('payment_methods')
    .select('id, name')
    .eq('is_active', true)
    .eq('category', 'billing')
    .order('sort_order', { ascending: true })
    .order('name')

  return (
    <MobileLayoutWithAuth>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">결제 등록</h1>
          <a href="/mobile/production" className="rounded-lg border px-3 py-1.5 text-sm">
            홈으로
          </a>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <form action={submit} className="grid md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-sm text-muted-foreground mb-1">출고 *</label>
              <select name="shipment_id" className="w-full rounded-lg border px-3 py-2" required>
                <option value="">출고 선택</option>
                {(shipments || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.shipment_number || s.id} · {s.sites?.name || '-'} · 총액{' '}
                    {Number(s.total_amount || 0).toLocaleString('ko-KR')} KRW
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">금액(KRW) *</label>
              <input
                type="number"
                name="amount"
                min="0"
                step="1"
                className="w-full rounded-lg border px-3 py-2"
                required
              />
              <input type="hidden" name="currency" value="KRW" />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">청구방식</label>
              <select name="payment_method_id" className="w-full rounded-lg border px-3 py-2">
                <option value="">선택 안 함</option>
                {(methods || []).map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">지급일</label>
              <input type="date" name="paid_at" className="w-full rounded-lg border px-3 py-2" />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm text-muted-foreground mb-1">메모</label>
              <input type="text" name="memo" className="w-full rounded-lg border px-3 py-2" />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full rounded-lg border px-3 py-2 bg-black text-white"
              >
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
