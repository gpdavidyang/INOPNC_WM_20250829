import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import '../../../styles/docs/ino-docs.css'
import '../../globals.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayout headerHeight="calc(54px + env(safe-area-inset-top, 0px))">
      <div className="doc-container">{children}</div>
    </MobileLayout>
  )
}
