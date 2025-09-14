'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { QueryProvider } from '@/providers/query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ErrorBoundary>
  )
}