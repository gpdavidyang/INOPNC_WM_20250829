import '../../globals.css'
import '../../../styles/docs/ino-docs.css'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayout>
      <div className="doc-container" style={{ paddingTop: 0, paddingBottom: 8 }}>
        {children}
      </div>
    </MobileLayout>
  )
}
