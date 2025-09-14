'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { AuthProvider } from '@/providers/auth-provider'
import { QueryProvider } from '@/providers/query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
