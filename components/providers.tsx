'use client'

import { User, Session } from '@supabase/supabase-js'
import { ErrorBoundary } from '@/components/error-boundary'
import { QueryProvider } from '@/providers/query-provider'
import { CompositeAuthProvider } from '@/providers/composite-auth-provider'

interface ProvidersProps {
  children: React.ReactNode
  initialUser?: User | null
  initialSession?: Session | null
  initialProfile?: any | null
}

export function Providers({
  children,
  initialUser,
  initialSession,
  initialProfile,
}: ProvidersProps) {
  return (
    <ErrorBoundary>
      <CompositeAuthProvider
        initialUser={initialUser}
        initialSession={initialSession}
        initialProfile={initialProfile}
      >
        <QueryProvider>{children}</QueryProvider>
      </CompositeAuthProvider>
    </ErrorBoundary>
  )
}
