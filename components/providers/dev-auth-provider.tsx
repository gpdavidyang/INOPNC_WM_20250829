'use client'

import { createContext, useContext } from 'react'
import { isDevelopmentAuthBypass, mockUser, mockProfile, mockSession } from '@/lib/dev-auth'

interface DevAuthContextType {
  user: typeof mockUser | null
  profile: typeof mockProfile | null
  session: typeof mockSession | null
  loading: boolean
  signOut: () => Promise<void>
}

const DevAuthContext = createContext<DevAuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: false,
  signOut: async () => {},
})

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  if (!isDevelopmentAuthBypass()) {
    return <>{children}</>
  }

  const contextValue: DevAuthContextType = {
    user: mockUser,
    profile: mockProfile,
    session: mockSession,
    loading: false,
    signOut: async () => {
      console.log('🔓 [DEV] Mock sign out')
    },
  }

  return <DevAuthContext.Provider value={contextValue}>{children}</DevAuthContext.Provider>
}

export const useDevAuth = () => {
  return useContext(DevAuthContext)
}
