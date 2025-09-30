import type { ReactNode } from 'react'
import { Providers } from '@/components/providers'

export const dynamic = 'force-dynamic'

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Force light mode for desktop partner routes to match desktop UI policy */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => { try { document.documentElement.setAttribute('data-theme','light'); document.documentElement.classList.remove('dark'); } catch(e){} })();`,
        }}
      />
      <Providers forcedTheme="light" enableSystem={false} defaultTheme="light">
        {children}
      </Providers>
    </>
  )
}
