'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { ensureClientSession } from '@/lib/supabase/session-bridge'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      if (newSession && !error) {
        setSession(newSession)
        setUser(newSession.user)
      } else if (error) {
        // Clear session on refresh error
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      // Clear session on error
      setSession(null)
      setUser(null)
    }
  }

  useEffect(() => {
    // Get initial session with session bridging
    const initializeAuth = async () => {
      try {
        // First attempt to get session normally
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession) {
          // Session found
          setSession(initialSession)
          setUser(initialSession.user)
          
          // Verify the session is still valid
          const { data: { user: verifiedUser } } = await supabase.auth.getUser()
          if (!verifiedUser) {
            // Session invalid, attempting refresh
            await refreshSession()
          }
        } else {
          // If no session, try to bridge from server cookies only if there's evidence of authentication
          // Only in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [AUTH-PROVIDER] No client session found, checking for server session...')
          }
          
          const bridgeResult = await ensureClientSession()
          
          if (bridgeResult.success && bridgeResult.session) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [AUTH-PROVIDER] Session bridged successfully for:', bridgeResult.session.user?.email)
            }
            setSession(bridgeResult.session)
            setUser(bridgeResult.session.user)
            
            // CRITICAL: After successful bridge, verify session is accessible with a fresh client
            // This ensures the singleton has been updated with the new session
            const freshClient = createClient()
            const { data: { session: verifiedSession } } = await freshClient.auth.getSession()
            
            if (verifiedSession) {
              // Session verified with fresh client
            } else {
              // Session not yet accessible with fresh client
            }
          } else {
            // No session available
          }
        }
      } catch (error) {
        // Error initializing auth
        if (process.env.NODE_ENV === 'development') {
          console.error('[AUTH-PROVIDER] Init error:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Silent auth state changes
      
      switch (event) {
        case 'SIGNED_IN':
          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)
            // CRITICAL FIX: Don't refresh on SIGNED_IN to prevent infinite loops
            // Only refresh on explicit user updates, not automatic sign-ins
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [AUTH-PROVIDER] User signed in:', newSession.user?.email)
            }
          }
          break
          
        case 'SIGNED_OUT':
          setSession(null)
          setUser(null)
          router.push('/auth/login')
          break
          
        case 'TOKEN_REFRESHED':
          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)
          }
          break
          
        case 'USER_UPDATED':
          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)
            router.refresh()
          }
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return (
    <AuthContext.Provider value={{ user, session, loading, refreshSession }}>
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}