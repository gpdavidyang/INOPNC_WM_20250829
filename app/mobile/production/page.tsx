import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

export const metadata: Metadata = { title: '생산관리' }

export default async function ProductionHomePage() {
  await requireAuth('/mobile/production')

  return (
    <MobileLayoutWithAuth>
      <div className="p-5 space-y-4">
        <h1 className="text-lg font-semibold">생산관리</h1>
        <div className="grid grid-cols-1 gap-3">
          <a
            className="rounded-lg border p-4 bg-white hover:bg-accent"
            href="/mobile/production/requests"
          >
            입고요청 조회
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
            출고·배송·결제 관리
          </a>
          <a
            className="rounded-lg border p-4 bg-white hover:bg-accent"
            href="/mobile/production/payments/new"
          >
            결제 등록
          </a>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
