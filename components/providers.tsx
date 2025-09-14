'use client'

import { ErrorBoundary } from '@/components/error-boundary'
// Migration: Using UnifiedAuthProvider which provides both old and new auth contexts
import { UnifiedAuthProvider } from '@/lib/auth/migration/auth-provider-adapter'
import { QueryProvider } from '@/providers/query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <UnifiedAuthProvider>{children}</UnifiedAuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
