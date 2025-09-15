import { ReactNode } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout'
import '@/modules/mobile/styles/mobile-global.css'
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/notification-modal.css'

export const dynamic = 'force-dynamic'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileRootLayout({ children }: MobileLayoutProps) {
  return <MobileLayout>{children}</MobileLayout>
}
