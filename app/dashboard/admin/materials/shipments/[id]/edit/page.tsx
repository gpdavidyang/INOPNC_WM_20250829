import type { Metadata } from 'next'
import ShippingEditPage, {
  metadata as mobileMetadata,
} from '@/app/mobile/production/shipping-payment/[id]/edit/page'

export const metadata: Metadata = {
  ...mobileMetadata,
  title: '출고 정보 수정',
}

export default ShippingEditPage
