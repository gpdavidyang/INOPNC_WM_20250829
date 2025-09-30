import { PartnerMobileHomeWrapper } from '@/modules/mobile/pages/partner/partner-home-wrapper'
import { PartnerMobileLayout } from '@/modules/mobile/components/layout/PartnerMobileLayout'

export const dynamic = 'force-dynamic'

export default function PartnerMobileHomePage() {
  return (
    <PartnerMobileLayout>
      <PartnerMobileHomeWrapper />
    </PartnerMobileLayout>
  )
}
