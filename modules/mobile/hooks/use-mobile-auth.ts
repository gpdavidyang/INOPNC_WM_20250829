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

  const getSession = useCallback(async () => {
    if (sessionRefreshing.current) return

    try {
      sessionRefreshing.current = true
      setError(null)
      console.log('[MOBILE-AUTH] Getting session...')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

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
      console.log('[MOBILE-AUTH] Fetching profile for user:', userId)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('[MOBILE-AUTH] Profile fetch error:', profileError)
        console.error('[MOBILE-AUTH] Error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        })
        setError(profileError.message)
        setProfile(null)
        return
      }

      console.log('[MOBILE-AUTH] Profile fetched successfully:', data?.full_name)
      setProfile(data)
      setError(null)
    } catch (err) {
      console.error('[MOBILE-AUTH] Profile fetch exception:', err)
      console.error('[MOBILE-AUTH] Exception details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Failed to fetch profile',
        stack: err instanceof Error ? err.stack : 'No stack trace',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      setProfile(null)
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  useEffect(() => {
    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      } else if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [getSession])

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
