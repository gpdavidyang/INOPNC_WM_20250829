import { ReactNode } from 'react'
import '@/modules/mobile/styles/mobile-global.css'
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/notification-modal.css'

export const dynamic = 'force-dynamic'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileRootLayout({ children }: MobileLayoutProps) {
  // Layout logic is now handled at the page level with MobileLayoutWithAuth
  // This prevents double layouts and allows auth context to be properly shared
  return <>{children}</>
}
