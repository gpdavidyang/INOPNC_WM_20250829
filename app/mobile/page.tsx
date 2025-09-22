import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

export const dynamic = 'force-dynamic'

export default function MobileHomePage() {
  return (
    <MobileLayoutWithAuth>
      <MobileHomeWrapper />
    </MobileLayoutWithAuth>
  )
}
