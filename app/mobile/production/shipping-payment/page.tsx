import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'

export const metadata: Metadata = { title: '출고배송 관리' }

// 입력 폼은 /mobile/production/shipping-payment/new 로 분리됨

export default async function ShippingPaymentPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  // 최근 출고 이력 (간단 검색 포함)
  const { data: shipmentsRaw } = await supabase
    .from('material_shipments')
    .select(
      `id, shipment_date, status, tracking_number, total_amount,
       sites(name),
       shipment_items(quantity, materials(name, code))`
    )
    .order('shipment_date', { ascending: false })
    .limit(100)

  const q = (searchParams?.q || '').trim()
  const shipments = (shipmentsRaw || []).filter((s: any) => {
    if (!q) return true
    const site = s.sites?.name || ''
    const track = s.tracking_number || ''
    const matNames = (s.shipment_items || []).map((i: any) => i.materials?.name || '').join(' ')
    const hay = `${site} ${track} ${matNames}`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })

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
    (acc: number, s: any) => acc + Number(s.total_amount || 0),
    0
  )

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="shipping" />}>
      <div className="p-5 space-y-5">
        {/* 요약 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-xs text-muted-foreground">이번 달 출고건수</div>
            <div className="mt-1 text-lg font-semibold">
              {totalShipmentsThisMonth.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-xs text-muted-foreground">총 출고수량</div>
            <div className="mt-1 text-lg font-semibold">{totalQtyThisMonth.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-xs text-muted-foreground">총 금액</div>
            <div className="mt-1 text-lg font-semibold">
              {totalAmountThisMonth.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 출고 이력 조회 */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">출고 이력</div>
            <form className="flex items-center gap-2" method="get">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="자재/현장/운송장 검색"
                className="rounded border px-3 py-2 text-sm"
              />
              <button className="rounded border px-3 py-2 text-sm" type="submit">
                검색
              </button>
            </form>
          </div>
          {(!shipments || shipments.length === 0) && (
            <div className="text-sm text-muted-foreground">출고 이력이 없습니다.</div>
          )}
          <div className="space-y-2">
            {(shipments || []).map((s: any) => {
              const totalQty = (s.shipment_items || []).reduce(
                (acc: number, it: any) => acc + Number(it.quantity || 0),
                0
              )
              const materialNames = (s.shipment_items || [])
                .map((it: any) => it.materials?.name || '-')
                .join(', ')
              return (
                <div key={s.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.sites?.name || '-'}</div>
                    <span className="text-xs rounded px-2 py-0.5 border">
                      {s.status || 'preparing'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    자재: {materialNames || '-'} · 수량 합계: {totalQty.toLocaleString()} · 일자:{' '}
                    {s.shipment_date ? new Date(s.shipment_date).toLocaleDateString('ko-KR') : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    운송장: {s.tracking_number || '-'} · 금액:{' '}
                    {Number(s.total_amount || 0).toLocaleString()}원
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 출고 등록 버튼 */}
        <div className="flex justify-end">
          <Link
            href="/mobile/production/shipping-payment/new"
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            출고 등록
          </Link>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
