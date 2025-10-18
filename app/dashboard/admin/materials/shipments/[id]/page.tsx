import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'

export const metadata: Metadata = { title: '출고 상세' }

export default async function AdminShipmentDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: shipment } = await supabase
    .from('material_shipments')
    .select(
      `
        *,
        sites!site_id(name, address),
        creator:profiles!created_by(name),
        billing_method:payment_methods!material_shipments_billing_method_id_fkey(id, name),
        shipping_method:payment_methods!material_shipments_shipping_method_id_fkey(id, name),
        freight_method:payment_methods!material_shipments_freight_charge_method_id_fkey(id, name),
        shipment_items(*, materials(name, code, unit))
      `
    )
    .eq('id', params.id)
    .maybeSingle()

  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('id, name')
    .eq('is_active', true)
    .eq('category', 'billing')
    .order('sort_order', { ascending: true })
    .order('name')

  const { data: payments } = await supabase
    .from('material_payments')
    .select('id, amount, currency, paid_at, memo, payment_methods(name)')
    .eq('shipment_id', params.id)
    .order('paid_at', { ascending: false })

  const paidSum = (payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
  const totalAmount = Number((shipment as any)?.total_amount || 0)
  const outstanding = Math.max(0, totalAmount - paidSum)

  async function addPayment(formData: FormData) {
    'use server'
    const supabase = (await import('@/lib/supabase/server')).createClient()
    const amount = Number(formData.get('amount') || 0)
    const currency = (formData.get('currency') as string) || 'KRW'
    const payment_method_id = ((formData.get('payment_method_id') as string) || '').trim() || null
    const paid_at = (formData.get('paid_at') as string) || null
    const memo = ((formData.get('memo') as string) || '').trim() || null
    if (amount <= 0) return
    await supabase.from('material_payments').insert({
      shipment_id: params.id,
      amount,
      currency,
      payment_method_id,
      paid_at,
      memo,
    } as any)
    ;(await import('next/cache')).revalidatePath('/dashboard/admin/materials')
  }

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="출고 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '출고 상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials?tab=shipments"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{shipment?.shipment_number || shipment?.id}</CardTitle>
            <CardDescription>{shipment?.sites?.name || '-'}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
            <div>
              <div className="text-xs">상태</div>
              <div className="text-foreground">{shipment?.status || '-'}</div>
            </div>
            <div>
              <div className="text-xs">출고일</div>
              <div className="text-foreground">
                {shipment?.shipment_date
                  ? new Date(shipment.shipment_date).toLocaleDateString('ko-KR')
                  : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs">배송방식</div>
              <div className="text-foreground">
                {shipment?.shipping_method?.name || shipment?.carrier || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs">운송장번호</div>
              <div className="text-foreground">{shipment?.tracking_number || '-'}</div>
            </div>
            <div>
              <div className="text-xs">청구방식</div>
              <div className="text-foreground">{shipment?.billing_method?.name || '-'}</div>
            </div>
            <div>
              <div className="text-xs">선불/착불</div>
              <div className="text-foreground">{shipment?.freight_method?.name || '-'}</div>
            </div>
            <div>
              <div className="text-xs">총 금액(KRW)</div>
              <div className="text-foreground">
                {typeof (shipment as any)?.total_amount === 'number'
                  ? ((shipment as any).total_amount as number).toLocaleString('ko-KR')
                  : '-'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>출고 항목</CardTitle>
            <CardDescription>총 {(shipment?.shipment_items || []).length}개</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<any>
              data={shipment?.shipment_items || []}
              rowKey={(it: any) => it.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'name',
                    header: '자재',
                    sortable: true,
                    render: (it: any) => (
                      <span className="font-medium text-foreground">
                        {it?.materials?.name || '-'}
                      </span>
                    ),
                  },
                  {
                    key: 'code',
                    header: '코드',
                    sortable: true,
                    render: (it: any) => it?.materials?.code || '-',
                  },
                  {
                    key: 'quantity',
                    header: '수량',
                    sortable: true,
                    align: 'right',
                    render: (it: any) => it?.quantity ?? 0,
                  },
                  {
                    key: 'unit',
                    header: '단위',
                    sortable: true,
                    render: (it: any) => it?.materials?.unit || '-',
                  },
                ] as Column<any>[]
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결제 내역</CardTitle>
            <CardDescription>
              합계: {paidSum.toLocaleString('ko-KR')} / 총액: {totalAmount.toLocaleString('ko-KR')}{' '}
              · 미수: {outstanding.toLocaleString('ko-KR')} KRW
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">일자</th>
                    <th className="py-2">금액</th>
                    <th className="py-2">통화</th>
                    <th className="py-2">청구방식</th>
                    <th className="py-2">메모</th>
                  </tr>
                </thead>
                <tbody>
                  {(!payments || payments.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        결제 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                  {(payments || []).map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="py-2">{Number(p.amount || 0).toLocaleString('ko-KR')}</td>
                      <td className="py-2">{p.currency || 'KRW'}</td>
                      <td className="py-2">{p.payment_methods?.name || '-'}</td>
                      <td className="py-2">{p.memo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form action={addPayment} className="grid md:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">일자</label>
                <input type="date" name="paid_at" className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">금액(KRW)</label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="1"
                  className="w-full rounded border px-3 py-2"
                  required
                />
                <input type="hidden" name="currency" value="KRW" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">청구방식</label>
                <select name="payment_method_id" className="w-full rounded border px-3 py-2">
                  <option value="">선택 안 함</option>
                  {(paymentMethods || []).map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">메모</label>
                <input type="text" name="memo" className="w-full rounded border px-3 py-2" />
              </div>
              <div className="md:col-span-6">
                <button type="submit" className="rounded border px-3 py-2 bg-black text-white">
                  결제 추가
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
