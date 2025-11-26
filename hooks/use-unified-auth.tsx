'use client'

import { UI_TRACK_COOKIE_NAME } from '@/lib/auth/constants'
import { createClient } from '@/lib/supabase/client'
import { AuthContext } from '@/modules/mobile/providers/AuthProvider'
import type { Session, User } from '@supabase/supabase-js'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

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

const DEFAULT_UI_TRACK = '/mobile'
const AUTH_ENDPOINT_TIMEOUT_MS = 5000
const PROFILE_FETCH_TIMEOUT_MS = 4000
const RESTRICTED_ROLES: ReadonlySet<Role> = new Set(['customer_manager', 'partner'])

type TimeoutResult<T> = { timedOut: false; value: T } | { timedOut: true }

function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<TimeoutResult<T>> {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise.then(value => ({ timedOut: false as const, value }))
  }

  return new Promise<TimeoutResult<T>>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.warn(`[useUnifiedAuth] ${label} timed out after ${timeoutMs}ms`)
      resolve({ timedOut: true as const })
    }, timeoutMs)

    promise
      .then(value => {
        clearTimeout(timeoutId)
        resolve({ timedOut: false as const, value })
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

function readUiTrackFromCookie(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_UI_TRACK
  }

  const cookieEntry = document.cookie
    ?.split(';')
    .map(entry => entry.trim())
    .find(entry => entry.startsWith(`${UI_TRACK_COOKIE_NAME}=`))

  if (!cookieEntry) {
    return DEFAULT_UI_TRACK
  }

  const [, value] = cookieEntry.split('=')
  try {
    return decodeURIComponent(value || '') || DEFAULT_UI_TRACK
  } catch (error) {
    console.warn('[useUnifiedAuth] Failed to decode UI track cookie:', error)
    return DEFAULT_UI_TRACK
  }
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
  const authContext = useContext(AuthContext)
  const usingProvider = authContext?.isProvider || false

  const supabase = useMemo(() => createClient(), [])
  const [authState, setAuthState] = useState<AuthState>(() =>
    usingProvider
      ? {
          ...INITIAL_STATE,
          user: authContext.user,
          session: authContext.session,
          profile: parseProfile((authContext.profile as UnifiedProfile | null) ?? null),
        }
      : INITIAL_STATE
  )
  const [loading, setLoading] = useState(usingProvider ? authContext.loading : true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const loadProfile = useCallback(
    async (userId: string): Promise<UnifiedProfile | null> => {
      try {
        const result = await runWithTimeout(
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          PROFILE_FETCH_TIMEOUT_MS,
          'profile fallback query'
        )

        if (result.timedOut) {
          return null
        }

        const { data, error } = result.value

        if (error) {
          console.warn('[useUnifiedAuth] Failed to load profile fallback:', error)
          return null
        }

        return parseProfile((data as UnifiedProfile) ?? null)
      } catch (err) {
        console.warn('[useUnifiedAuth] Unexpected profile fallback error:', err)
        return null
      }
    },
    [supabase]
  )

  const fetchAuth = useCallback(async (): Promise<AuthResponse> => {
    let payload: Partial<AuthResponse> | null = null
    const supportsAbort = typeof AbortController !== 'undefined'
    const controller = supportsAbort ? new AbortController() : undefined

    try {
      const fetchResult = await runWithTimeout(
        fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller?.signal,
        }),
        AUTH_ENDPOINT_TIMEOUT_MS,
        '/api/auth/me request'
      )

      if (fetchResult.timedOut) {
        if (controller) {
          controller.abort()
        }
      } else {
        const response = fetchResult.value

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

        payload = (await response.json()) as Partial<AuthResponse>
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        console.warn('[useUnifiedAuth] /api/auth/me request aborted. Using client fallback.')
      } else {
        console.warn('[useUnifiedAuth] /api/auth/me request failed. Using client fallback.', err)
      }
    }

    let session: Session | null = null
    let user: User | null = null

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.warn('[useUnifiedAuth] Failed to retrieve client session:', sessionError)
      }

      session = sessionData.session ?? null
      user = session?.user ?? null
    } catch (err) {
      console.warn(
        '[useUnifiedAuth] supabase.auth.getSession() failed. Using payload fallback.',
        err
      )
    }

    session = session ?? (payload?.session as Session | null) ?? null
    user = user ?? session?.user ?? (payload?.user as User | null) ?? null

    if (!user) {
      return {
        ...INITIAL_STATE,
        uiTrack: payload?.uiTrack || readUiTrackFromCookie(),
      }
    }

    let profile = parseProfile((payload?.profile as UnifiedProfile | null) ?? null)
    if (!profile) {
      profile = await loadProfile(user.id)
    }

    const restrictedOrgId =
      (payload?.restrictedOrgId as string | null) ??
      (profile?.organization_id ? String(profile.organization_id) : null)

    const isRestricted =
      typeof payload?.isRestricted === 'boolean'
        ? payload.isRestricted
        : !!(profile?.role && RESTRICTED_ROLES.has(profile.role))

    const uiTrack = payload?.uiTrack || readUiTrackFromCookie() || DEFAULT_UI_TRACK

    return {
      user,
      profile,
      session,
      isRestricted,
      restrictedOrgId,
      uiTrack,
    }
  }, [loadProfile, supabase])

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
    if (!usingProvider) {
      bootstrap()
    }
    return () => {
      isMountedRef.current = false
    }
  }, [bootstrap, usingProvider])

  useEffect(() => {
    if (!usingProvider) return

    setError(null)
    setAuthState(prev => ({
      ...prev,
      user: authContext.user,
      session: authContext.session,
      profile: parseProfile((authContext.profile as UnifiedProfile | null) ?? null),
    }))
    setLoading(authContext.loading)
  }, [
    usingProvider,
    authContext.user,
    authContext.session,
    authContext.profile,
    authContext.loading,
  ])

  const refreshProfile = useCallback(async () => {
    if (usingProvider) {
      await authContext.refreshProfile()
      return
    }

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
  }, [authState.user?.id, supabase, usingProvider, authContext.refreshProfile])

  const refreshSession = useCallback(async () => {
    if (usingProvider) {
      await authContext.refreshSession()
      return
    }

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
  }, [authContext.refreshSession, fetchAuth, supabase, usingProvider])

  const signOut = useCallback(async () => {
    if (usingProvider) {
      await authContext.signOut()
      return
    }

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
          UI_TRACK_COOKIE_NAME,
          'user-id',
          'session-id',
        ]

        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        })

        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('user-role')
        localStorage.removeItem(UI_TRACK_COOKIE_NAME)
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
  }, [supabase, usingProvider, authContext.signOut])

  const role = authState.profile?.role as Role

  const isSystemAdmin = role === 'system_admin'
  const isAdmin = role === 'admin' || isSystemAdmin
  const isCustomerManager = role === 'customer_manager' || role === 'partner'
  const isSiteManager = role === 'site_manager' || isAdmin
  const isWorker = role === 'worker'
  const canAccessMobile = !!(
    role &&
    ['worker', 'site_manager', 'customer_manager', 'partner', 'production_manager'].includes(role)
  )
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
