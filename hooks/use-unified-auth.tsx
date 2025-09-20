'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

type Role =
  | 'worker'
  | 'site_manager'
  | 'customer_manager'
  | 'admin'
  | 'system_admin'
  | 'partner'
  | 'production_manager'
  | null
  | undefined

interface UnifiedProfile {
  id: string
  email?: string | null
  full_name?: string | null
  role?: Role
  organization_id?: string | null
  site_id?: string | null
  [key: string]: unknown
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: UnifiedProfile | null
  isRestricted: boolean
  restrictedOrgId: string | null
  uiTrack: string
}

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  profile: null,
  isRestricted: false,
  restrictedOrgId: null,
  uiTrack: '/mobile',
}

type AuthResponse = {
  user: User | null
  profile: UnifiedProfile | null
  session: Session | null
  isRestricted: boolean
  restrictedOrgId: string | null
  uiTrack: string
}

function parseProfile(profile: UnifiedProfile | null): UnifiedProfile | null {
  if (!profile) return null

  const nextProfile: UnifiedProfile = { ...profile }

  if (typeof nextProfile.notification_preferences === 'string') {
    try {
      nextProfile.notification_preferences = JSON.parse(
        nextProfile.notification_preferences as string
      )
    } catch (error) {
      console.warn('[useUnifiedAuth] Failed to parse notification_preferences:', error)
    }
  }

  return nextProfile
}

export function useUnifiedAuth() {
  const supabase = useMemo(() => createClient(), [])
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchAuth = useCallback(async (): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    })

    if (response.status === 401) {
      return {
        ...INITIAL_STATE,
        user: null,
        profile: null,
        session: null,
      }
    }

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Failed to load auth state')
    }

    const payload = (await response.json()) as Partial<AuthResponse>

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.warn('[useUnifiedAuth] Failed to retrieve client session:', sessionError)
    }

    const session = sessionData.session ?? null
    const user = session?.user ?? (payload.user as User | null) ?? null

    return {
      user,
      profile: parseProfile((payload.profile as UnifiedProfile | null) ?? null),
      session,
      isRestricted: !!payload.isRestricted,
      restrictedOrgId: (payload.restrictedOrgId as string | null) ?? null,
      uiTrack: payload.uiTrack || '/mobile',
    }
  }, [supabase])

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const auth = await fetchAuth()
      if (!isMountedRef.current) return
      setAuthState(prev => ({ ...prev, ...auth }))
    } catch (err) {
      console.error('[useUnifiedAuth] bootstrap error:', err)
      if (!isMountedRef.current) return
      setAuthState(INITIAL_STATE)
      setError(err instanceof Error ? err.message : 'Failed to load auth')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchAuth])

  useEffect(() => {
    isMountedRef.current = true
    bootstrap()
    return () => {
      isMountedRef.current = false
    }
  }, [bootstrap])

  const refreshProfile = useCallback(async () => {
    const userId = authState.user?.id
    if (!userId) return

    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw profileError
      }

      if (!isMountedRef.current) return
      setAuthState(prev => ({
        ...prev,
        profile: parseProfile(data as UnifiedProfile),
      }))
    } catch (err) {
      console.error('[useUnifiedAuth] refreshProfile error:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh profile')
      throw err
    }
  }, [authState.user?.id, supabase])

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await supabase.auth.refreshSession()
    } catch (err) {
      console.warn('[useUnifiedAuth] refreshSession warning:', err)
    } finally {
      try {
        const auth = await fetchAuth()
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, ...auth }))
        }
      } catch (err) {
        console.error('[useUnifiedAuth] refreshSession fetch error:', err)
        if (isMountedRef.current) {
          setAuthState(INITIAL_STATE)
          setError(err instanceof Error ? err.message : 'Failed to refresh session')
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }
  }, [fetchAuth, supabase])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[useUnifiedAuth] signOut error:', err)
    } finally {
      setAuthState(INITIAL_STATE)
      setError(null)
      setLoading(false)

      try {
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
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        })

        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('user-role')
        localStorage.removeItem('session-data')
        sessionStorage.removeItem('auth-session')
        sessionStorage.removeItem('temp-auth')
      } catch (cleanupError) {
        console.warn('[useUnifiedAuth] signOut cleanup warning:', cleanupError)
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
  }, [supabase])

  const role = authState.profile?.role as Role

  const isSystemAdmin = role === 'system_admin'
  const isAdmin = role === 'admin' || isSystemAdmin
  const isCustomerManager = role === 'customer_manager' || role === 'partner'
  const isSiteManager = role === 'site_manager' || isAdmin
  const isWorker = role === 'worker'
  const canAccessMobile = !!(role && ['worker', 'site_manager', 'customer_manager', 'partner'].includes(role))
  const canAccessAdmin = !!(role && ['admin', 'system_admin'].includes(role))

  const canManageUsers = isAdmin || isSystemAdmin
  const canManageSites = isAdmin || isSystemAdmin
  const canApproveReports = isSiteManager || isAdmin || isSystemAdmin
  const canCreateReports = isWorker || isSiteManager || isAdmin || isSystemAdmin
  const canViewAllReports = isAdmin || isSystemAdmin || isCustomerManager

  const getCurrentSite = useCallback(async () => {
    const siteId = authState.profile?.site_id
    if (!siteId) return null

    const { data, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .maybeSingle()

    if (siteError) {
      console.error('[useUnifiedAuth] getCurrentSite error:', siteError)
      return null
    }

    return data
  }, [authState.profile?.site_id, supabase])

  const getUserRole = useCallback(() => role ?? null, [role])

  return {
    user: authState.user,
    session: authState.session,
    loading,
    error,
    profile: authState.profile,
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
    canManageUsers,
    canManageSites,
    canApproveReports,
    canCreateReports,
    canViewAllReports,
    uiTrack: authState.uiTrack,
    isRestricted: authState.isRestricted,
    restrictedOrgId: authState.restrictedOrgId,
    getCurrentSite,
    getUserRole,
  }
}

export const useAuth = useUnifiedAuth
export const useMobileAuth = useUnifiedAuth
export const useMobileUser = useUnifiedAuth
