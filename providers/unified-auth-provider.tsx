'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isDevelopmentAuthBypass, mockUser, mockProfile } from '@/lib/dev-auth'

// Unified Profile interface combining all implementations
interface UnifiedProfile {
  id: string
  full_name?: string
  email: string
  role?: 'worker' | 'site_manager' | 'customer_manager' | 'admin' | 'system_admin'
  site_id?: string
  phone?: string
  organization_id?: string
  created_at?: string
  status?: string
}

// Comprehensive context interface combining all features
interface UnifiedAuthContextType {
  // Core auth state
  user: User | null
  session: Session | null
  profile: UnifiedProfile | null

  // Loading and error states
  loading: boolean
  error: string | null

  // Actions
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>

  // Role-based access (from hooks/use-auth.tsx)
  canAccessMobile: boolean
  canAccessAdmin: boolean
  isWorker: boolean
  isSiteManager: boolean
  isCustomerManager: boolean
  isAdmin: boolean
  isSystemAdmin: boolean

  // Mobile-specific features
  getCurrentSite: () => Promise<any>
  getUserRole: () => string | null
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined)

interface UnifiedAuthProviderProps {
  children: React.ReactNode
  // Support server-side initial data for mobile
  initialUser?: User | null
  initialSession?: Session | null
  initialProfile?: UnifiedProfile | null
}

export function UnifiedAuthProvider({
  children,
  initialUser = null,
  initialSession = null,
  initialProfile = null,
}: UnifiedAuthProviderProps) {
  const isDevBypass = isDevelopmentAuthBypass()

  // Core state
  const [user, setUser] = useState<User | null>(isDevBypass ? (mockUser as any) : initialUser)
  const [session, setSession] = useState<Session | null>(isDevBypass ? null : initialSession)
  const [profile, setProfile] = useState<UnifiedProfile | null>(
    isDevBypass ? mockProfile : initialProfile
  )

  // Loading and error states
  const [loading, setLoading] = useState(!isDevBypass && !initialUser)
  const [error, setError] = useState<string | null>(null)

  // Refs for preventing duplicate requests
  const sessionRefreshing = useRef(false)
  const profileFetching = useRef(false)
  const authStateDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createClient()

  // Profile fetching with timeout and error handling
  const fetchProfile = useCallback(
    async (userId: string): Promise<void> => {
      if (profileFetching.current) return

      try {
        profileFetching.current = true
        console.log('[UNIFIED-AUTH] Fetching profile for user:', userId)

        const fetchWithTimeout = Promise.race([
          supabase?.from('profiles').select('*').eq('id', userId).single(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout after 8 seconds')), 8000)
          ),
        ])

        const { data, error: profileError } = (await fetchWithTimeout) as any

        if (profileError) {
          console.error('[UNIFIED-AUTH] Profile fetch error:', profileError)
          setError(profileError.message)
          return
        }

        console.log('[UNIFIED-AUTH] Profile fetched successfully:', {
          id: data?.id,
          full_name: data?.full_name,
          email: data?.email,
          role: data?.role,
        })

        setProfile(data)
        setError(null)
      } catch (err: any) {
        console.error('[UNIFIED-AUTH] Profile fetch exception:', err)
        setError(err?.message || 'Failed to fetch profile')

        // Fallback to basic user info if profile fetch fails
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'worker', // Default role
          })
        }
      } finally {
        profileFetching.current = false
        setLoading(false)
      }
    },
    [user, supabase]
  )

  // Session management
  const getSession = useCallback(async (): Promise<void> => {
    if (sessionRefreshing.current) return

    try {
      sessionRefreshing.current = true
      setError(null)
      console.log('[UNIFIED-AUTH] Getting session...')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[UNIFIED-AUTH] Session error:', sessionError)
        setError(sessionError.message)
        setUser(null)
        setSession(null)
        setProfile(null)
        return
      }

      if (session?.user) {
        console.log('[UNIFIED-AUTH] Session found for user:', session.user.email)
        setUser(session.user)
        setSession(session)
        await fetchProfile(session.user.id)
      } else {
        console.log('[UNIFIED-AUTH] No active session found')
        setUser(null)
        setSession(null)
        setProfile(null)
      }
    } catch (err) {
      console.error('[UNIFIED-AUTH] Get session exception:', err)
      setError(err instanceof Error ? err.message : 'Failed to get session')
      setUser(null)
      setSession(null)
      setProfile(null)
    } finally {
      sessionRefreshing.current = false
      setLoading(false)
    }
  }, [supabase, fetchProfile])

  // Actions
  const refreshSession = useCallback(async (): Promise<void> => {
    await getSession()
  }, [getSession])

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log('[UNIFIED-AUTH] Signing out...')
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      setError(null)
    } catch (error) {
      console.error('[UNIFIED-AUTH] Sign out error:', error)
    }
  }, [supabase])

  // Role-based access computed properties
  const canAccessMobile = !!(
    profile?.role && ['worker', 'site_manager', 'customer_manager'].includes(profile.role)
  )
  const canAccessAdmin = !!(profile?.role && ['admin', 'system_admin'].includes(profile.role))
  const isWorker = profile?.role === 'worker'
  const isSiteManager = profile?.role === 'site_manager'
  const isCustomerManager = profile?.role === 'customer_manager'
  const isAdmin = profile?.role === 'admin'
  const isSystemAdmin = profile?.role === 'system_admin'

  // Mobile-specific helper functions
  const getCurrentSite = useCallback(async () => {
    if (!profile?.site_id) return null

    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', profile.site_id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[UNIFIED-AUTH] Get current site error:', error)
      return null
    }
  }, [profile?.site_id, supabase])

  const getUserRole = useCallback(() => {
    return profile?.role || null
  }, [profile?.role])

  // Initialize authentication
  useEffect(() => {
    // Skip if development bypass is enabled
    if (isDevBypass) {
      console.log('[UNIFIED-AUTH] Using mock authentication')
      setLoading(false)
      return
    }

    // Skip if we already have initial data from server (mobile SSR)
    if (initialUser && initialProfile) {
      console.log('[UNIFIED-AUTH] Using server-provided initial data')
      setLoading(false)
      return
    }

    // Get initial session for client-side rendered components
    getSession()
  }, [isDevBypass, initialUser, initialProfile, getSession])

  // Auth state change listener
  useEffect(() => {
    if (isDevBypass) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[UNIFIED-AUTH] Auth state changed:', event, 'User:', session?.user?.email)

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
            setProfile(null)
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
              setLoading(true)
              await fetchProfile(session.user.id)
            }
          }
        } catch (error) {
          console.error('[UNIFIED-AUTH] Auth state change error:', error)
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
  }, [isDevBypass, supabase.auth, fetchProfile])

  // Retry profile fetch if loading gets stuck
  useEffect(() => {
    const retryTimeout = setTimeout(() => {
      if (loading && user && !profile && !profileFetching.current) {
        console.log('[UNIFIED-AUTH] Retrying profile fetch after timeout...')
        fetchProfile(user.id)
      }
    }, 5000)

    return () => clearTimeout(retryTimeout)
  }, [loading, user, profile, fetchProfile])

  const contextValue: UnifiedAuthContextType = {
    user,
    session,
    profile,
    loading,
    error,
    signOut,
    refreshSession,
    refreshProfile,
    canAccessMobile,
    canAccessAdmin,
    isWorker,
    isSiteManager,
    isCustomerManager,
    isAdmin,
    isSystemAdmin,
    getCurrentSite,
    getUserRole,
  }

  return <UnifiedAuthContext.Provider value={contextValue}>{children}</UnifiedAuthContext.Provider>
}

// Custom hook to use the unified auth context
export function useUnifiedAuth(): UnifiedAuthContextType {
  const context = useContext(UnifiedAuthContext)
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider')
  }
  return context
}

// Legacy aliases for backward compatibility
export const useAuth = useUnifiedAuth
export const useMobileAuth = useUnifiedAuth
export const useMobileUser = useUnifiedAuth
