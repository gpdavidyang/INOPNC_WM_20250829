'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name?: string
  email: string
  role?: string
  site_id?: string
  phone?: string
  created_at?: string
}

interface UseMobileAuthReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  canAccessMobile: boolean
  isWorker: boolean
  isSiteManager: boolean
  isCustomerManager: boolean
}

export function useMobileAuth(): UseMobileAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionRefreshing = useRef(false)

  const supabase = createClient()

  // Early return if supabase client is not available
  if (!supabase) {
    console.error('[MOBILE-AUTH] Supabase client is not available')
  }

  const getSession = useCallback(async () => {
    if (sessionRefreshing.current) return

    try {
      sessionRefreshing.current = true
      setError(null)
      console.log('[MOBILE-AUTH] Getting session...')

      const {
        data: { session },
        error: sessionError,
      } = (await supabase?.auth.getSession()) || {
        data: { session: null },
        error: new Error('Supabase client not available'),
      }

      if (sessionError) {
        console.error('[MOBILE-AUTH] Session error:', sessionError)
        console.error('[MOBILE-AUTH] Session error details:', {
          code: sessionError.message,
          url: window.location.href,
          userAgent: navigator.userAgent,
        })
        setError(sessionError.message)
        setUser(null)
        setProfile(null)
        return
      }

      if (session?.user) {
        console.log('[MOBILE-AUTH] Session found for user:', session.user.email)
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        console.log('[MOBILE-AUTH] No active session found')
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      console.error('[MOBILE-AUTH] Get session exception:', err)
      console.error('[MOBILE-AUTH] Exception details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Failed to get session',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
      setError(err instanceof Error ? err.message : 'Failed to get session')
      setUser(null)
      setProfile(null)
    } finally {
      sessionRefreshing.current = false
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[MOBILE-AUTH] Starting profile fetch for user:', userId)

      // Add timeout to prevent hanging
      const fetchWithTimeout = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Profile fetch timeout after 10 seconds'))
        }, 10000)

        supabase
          ?.from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          .then(({ data, error }: { data: any; error: any }) => {
            clearTimeout(timeout)
            if (error) {
              reject(error)
            } else {
              resolve(data)
            }
          })
          .catch(err => {
            clearTimeout(timeout)
            reject(err)
          })
      })

      const data = (await fetchWithTimeout) as any

      console.log('[MOBILE-AUTH] Profile fetched successfully:', {
        id: data?.id,
        full_name: data?.full_name,
        email: data?.email,
        role: data?.role,
        hasPhone: !!data?.phone,
        hasCreatedAt: !!data?.created_at,
      })

      setProfile(data)
      setError(null)
    } catch (err: any) {
      console.error('[MOBILE-AUTH] Profile fetch error:', err)
      console.error('[MOBILE-AUTH] Error details:', {
        name: err?.name || 'Unknown',
        message: err?.message || 'Failed to fetch profile',
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack,
        userId,
      })
      setError(err?.message || 'Failed to fetch profile')
      setProfile(null)
    } finally {
      // Ensure loading is set to false regardless of success or failure
      setLoading(false)
      console.log('[MOBILE-AUTH] Profile fetch completed, loading state set to false')
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user])

  const signOut = useCallback(async () => {
    try {
      await supabase?.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  useEffect(() => {
    // Initial session fetch
    getSession()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[MOBILE-AUTH] Auth state changed:', event, 'User:', session?.user?.email)

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user)
          setLoading(true) // Set loading before fetching profile
          await fetchProfile(session.user.id)
        }
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        // Handle initial session load
        setUser(session.user)
        setLoading(true)
        await fetchProfile(session.user.id)
      }
    })

    // Retry profile fetch after a delay if still loading
    const retryTimeout = setTimeout(() => {
      if (loading && user && !profile) {
        console.log('[MOBILE-AUTH] Retrying profile fetch after 2 seconds...')
        fetchProfile(user.id)
      }
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(retryTimeout)
    }
  }, [getSession, user, loading, profile])

  // Computed properties for role checks
  const canAccessMobile = !!(
    profile?.role && ['worker', 'site_manager', 'customer_manager'].includes(profile.role)
  )
  const isWorker = profile?.role === 'worker'
  const isSiteManager = profile?.role === 'site_manager'
  const isCustomerManager = profile?.role === 'customer_manager'

  return {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
    canAccessMobile,
    isWorker,
    isSiteManager,
    isCustomerManager,
  }
}

// Legacy alias for backward compatibility
export const useMobileUser = useMobileAuth
