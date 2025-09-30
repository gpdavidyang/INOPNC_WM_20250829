import { PartnerMobileLayout } from '@/modules/mobile/components/layout/PartnerMobileLayout'
import PartnerOutputPage from '@/modules/mobile/pages/partner/PartnerOutputPage'

export const dynamic = 'force-dynamic'

export default function PartnerOutput() {
  return (
    <PartnerMobileLayout>
      <PartnerOutputPage />
    </PartnerMobileLayout>
  )
}
