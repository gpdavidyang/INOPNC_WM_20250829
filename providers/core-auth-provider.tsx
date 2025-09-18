'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isDevelopmentAuthBypass, mockUser } from '@/lib/dev-auth'

interface CoreAuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const CoreAuthContext = createContext<CoreAuthContextType | undefined>(undefined)

interface CoreAuthProviderProps {
  children: React.ReactNode
  initialUser?: User | null
  initialSession?: Session | null
}

export function CoreAuthProvider({
  children,
  initialUser = null,
  initialSession = null,
}: CoreAuthProviderProps) {
  const isDevBypass = isDevelopmentAuthBypass()

  // Core authentication state only
  const [user, setUser] = useState<User | null>(isDevBypass ? (mockUser as any) : initialUser)
  const [session, setSession] = useState<Session | null>(isDevBypass ? null : initialSession)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent duplicate requests
  const sessionRefreshing = useRef(false)
  const authStateDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createClient()

  // Session management
  const getSession = useCallback(async (): Promise<void> => {
    if (sessionRefreshing.current) return

    try {
      sessionRefreshing.current = true
      setLoading(true)
      setError(null)
      console.log('[CORE-AUTH] Getting session...')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[CORE-AUTH] Session error:', sessionError)
        setError(sessionError.message)
        setUser(null)
        setSession(null)
        return
      }

      if (session?.user) {
        console.log('[CORE-AUTH] Session found for user:', session.user.email)
        setUser(session.user)
        setSession(session)
      } else {
        console.log('[CORE-AUTH] No active session found')
        setUser(null)
        setSession(null)
      }
    } catch (err) {
      console.error('[CORE-AUTH] Get session exception:', err)
      setError(err instanceof Error ? err.message : 'Failed to get session')
      setUser(null)
      setSession(null)
    } finally {
      sessionRefreshing.current = false
      setLoading(false)
    }
  }, [supabase])

  // Actions
  const refreshSession = useCallback(async (): Promise<void> => {
    await getSession()
  }, [getSession])

  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log('[CORE-AUTH] Signing out...')

      // 1. Clear Supabase authentication
      await supabase.auth.signOut()

      // 2. Clear all authentication cookies set by middleware
      const cookiesToClear = [
        'auth-token',
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'user-role',
        'user-id',
        'session-id',
      ]

      cookiesToClear.forEach(cookieName => {
        // Clear cookie for current domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        // Clear cookie for all subdomains
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        // Clear secure cookies
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
      })

      // 3. Clear local storage authentication data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('user-role')
        localStorage.removeItem('session-data')
      }

      // 4. Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth-session')
        sessionStorage.removeItem('temp-auth')
      }

      // 5. Clear provider state
      setUser(null)
      setSession(null)
      setError(null)
      setLoading(false)

      console.log('[CORE-AUTH] Complete logout with cookie and storage cleanup')

      // 6. Force redirect to login to prevent cached page access
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('[CORE-AUTH] Sign out error:', error)
      // Even if there's an error, still clear local state and redirect
      setUser(null)
      setSession(null)
      setError(null)
      window.location.href = '/auth/login'
    }
  }, [supabase])

  // Initialize authentication
  useEffect(() => {
    // Skip if development bypass is enabled
    if (isDevBypass) {
      console.log('[CORE-AUTH] Using mock authentication')
      setLoading(false)
      return
    }

    // Skip if we already have initial data from server (mobile SSR)
    if (initialUser && initialSession) {
      console.log('[CORE-AUTH] Using server-provided initial data')
      setLoading(false)
      return
    }

    // Get initial session for client-side rendered components
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('[CORE-AUTH] Session check timeout, setting loading to false')
        setLoading(false)
      }
    }, 2000) // 2 second timeout for initial load

    getSession().finally(() => {
      clearTimeout(timeoutId)
    })

    return () => clearTimeout(timeoutId)
  }, [isDevBypass, initialUser, initialSession, getSession])

  // Auth state change listener
  useEffect(() => {
    if (isDevBypass) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[CORE-AUTH] Auth state changed:', event, 'User:', session?.user?.email)

      // Clear previous debounced call
      if (authStateDebounceRef.current) {
        clearTimeout(authStateDebounceRef.current)
      }

      // Debounce auth state changes to prevent rapid successive calls
      authStateDebounceRef.current = setTimeout(async () => {
        try {
          if (event === 'SIGNED_OUT') {
            setUser(null)
            setSession(null)
            setLoading(false)
            setError(null)
          } else if (
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          ) {
            if (session?.user) {
              setUser(session.user)
              setSession(session)
            }
          }
        } catch (error) {
          console.error('[CORE-AUTH] Auth state change error:', error)
          setError(error instanceof Error ? error.message : 'Auth state change failed')
          setLoading(false)
        }
      }, 150) // 150ms debounce to prevent performance issues
    })

    return () => {
      subscription.unsubscribe()
      if (authStateDebounceRef.current) {
        clearTimeout(authStateDebounceRef.current)
      }
    }
  }, [isDevBypass, supabase.auth])

  const contextValue: CoreAuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
  }

  return <CoreAuthContext.Provider value={contextValue}>{children}</CoreAuthContext.Provider>
}

// Hook to use the core auth context
export function useCoreAuth(): CoreAuthContextType {
  const context = useContext(CoreAuthContext)
  if (context === undefined) {
    throw new Error('useCoreAuth must be used within a CoreAuthProvider')
  }
  return context
}
