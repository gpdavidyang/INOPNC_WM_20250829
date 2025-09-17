'use client'

import { User } from '@supabase/supabase-js'
import { ErrorBoundary } from '@/components/error-boundary'
import { QueryProvider } from '@/providers/query-provider'
import { UnifiedAuthProvider } from '@/providers/unified-auth-provider'

interface ProvidersProps {
  children: React.ReactNode
  initialUser?: User | null
  initialProfile?: any | null
}

export function Providers({ children, initialUser, initialProfile }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <UnifiedAuthProvider initialUser={initialUser} initialProfile={initialProfile}>
        <QueryProvider>{children}</QueryProvider>
      </UnifiedAuthProvider>
    </ErrorBoundary>
  )
}
