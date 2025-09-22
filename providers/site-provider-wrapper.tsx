'use client'

import { SiteProvider } from '@/contexts/SiteContext'

export function SiteProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SiteProvider>{children}</SiteProvider>
}