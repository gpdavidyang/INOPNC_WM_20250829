import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'

export const metadata: Metadata = { title: '생산관리' }

export default async function ProductionHomePage() {
  await requireAuth('/mobile/production')

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs />}>
      <div className="p-5 space-y-4">
        <h1 className="text-lg font-semibold">생산관리</h1>
        <div className="grid grid-cols-1 gap-3">
          <a
            className="rounded-lg border p-4 bg-white hover:bg-accent"
            href="/mobile/production/requests"
          >
            주문요청 조회
          </a>
          <a
            className="rounded-lg border p-4 bg-white hover:bg-accent"
            href="/mobile/production/production"
          >
            생산정보 관리
          </a>
          <a
            className="rounded-lg border p-4 bg-white hover:bg-accent"
            href="/mobile/production/shipping-payment"
          >
            출고배송 관리
          </a>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
