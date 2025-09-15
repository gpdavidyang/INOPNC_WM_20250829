import { ReactNode } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout'
import '@/modules/mobile/styles/mobile-global.css'

export const dynamic = 'force-dynamic'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileRootLayout({ children }: MobileLayoutProps) {
  return <MobileLayout>{children}</MobileLayout>
}
