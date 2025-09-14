/**
 * Auth Context Provider
 *
 * Provides authentication state and methods to the React component tree.
 * Manages session, user profile, and authentication flow.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  IAuthProvider,
  AuthSession,
  AuthUser,
  AuthChangeEvent,
  EmailPasswordCredentials,
  PhonePasswordCredentials,
  SignUpData,
  PasswordResetRequest,
} from '../providers'
import { getAuthProvider } from '../providers'
import { permissionService } from '../services'
import { getRoleBasedRoute, AUTH_ROUTES } from '../routing'
import { AuthCircuitBreaker } from '../circuit-breaker'

/**
 * Auth Context State
 */
interface AuthContextState {
  // State
  session: AuthSession | null
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null

  // Auth methods
  signIn: (credentials: EmailPasswordCredentials | PhonePasswordCredentials) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string, redirectTo?: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>

  // Session methods
  refreshSession: () => Promise<void>
  clearError: () => void

  // Permission checks
  hasPermission: (permission: string) => boolean
  canAccessRoute: (route: string) => boolean
  canManageUser: (targetRole: string) => boolean
}

/**
 * Auth Context
 */
export const AuthContext = createContext<AuthContextState | undefined>(undefined)

/**
 * Auth Context Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode
  provider?: IAuthProvider
  redirectAfterLogin?: string
  redirectAfterLogout?: string
  enableAutoRefresh?: boolean
  refreshInterval?: number
}

/**
 * Auth Context Provider Component
 */
export function AuthProvider({
  children,
  provider: customProvider,
  redirectAfterLogin,
  redirectAfterLogout = AUTH_ROUTES.LOGIN,
  enableAutoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Get auth provider
  const authProvider = useMemo(() => {
    return customProvider || getAuthProvider()
  }, [customProvider])

  // State
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Derived state
  const user = session?.user || null
  const isAuthenticated = !!session

  /**
   * Initialize auth state
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: currentSession, error: sessionError } = await authProvider.getSession()

      if (sessionError) {
        console.error('[AuthContext] Session error:', sessionError)
        setSession(null)
      } else {
        setSession(currentSession || null)

        // Check if token needs refresh
        if (currentSession && currentSession.expiresAt) {
          const now = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = currentSession.expiresAt - now

          // Refresh if expiring in less than 10 minutes
          if (timeUntilExpiry < 600) {
            console.log('[AuthContext] Token expiring soon, refreshing...')
            await refreshSession()
          }
        }
      }
    } catch (err) {
      console.error('[AuthContext] Failed to initialize auth:', err)
      setError(err as Error)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [authProvider])

  /**
   * Sign in with credentials
   */
  const signIn = useCallback(
    async (credentials: EmailPasswordCredentials | PhonePasswordCredentials) => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: newSession, error: signInError } =
          await authProvider.signInWithPassword(credentials)

        if (signInError) {
          throw new Error(signInError.message)
        }

        if (!newSession) {
          throw new Error('Failed to sign in')
        }

        setSession(newSession)

        // Redirect based on role
        const targetRoute = redirectAfterLogin || getRoleBasedRoute(newSession.user.role)

        // Check circuit breaker before redirect
        if (AuthCircuitBreaker.checkRedirect(targetRoute)) {
          router.push(targetRoute)
        } else {
          console.error('[AuthContext] Redirect blocked by circuit breaker')
          setError(new Error('Too many redirects detected. Please refresh the page.'))
        }
      } catch (err) {
        console.error('[AuthContext] Sign in failed:', err)
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [authProvider, router, redirectAfterLogin]
  )

  /**
   * Sign up new user
   */
  const signUp = useCallback(
    async (data: SignUpData) => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: newSession, error: signUpError } = await authProvider.signUp(data)

        if (signUpError) {
          throw new Error(signUpError.message)
        }

        if (!newSession) {
          throw new Error('Failed to sign up')
        }

        setSession(newSession)

        // Redirect to onboarding or dashboard
        const targetRoute = redirectAfterLogin || getRoleBasedRoute(newSession.user.role)

        if (AuthCircuitBreaker.checkRedirect(targetRoute)) {
          router.push(targetRoute)
        }
      } catch (err) {
        console.error('[AuthContext] Sign up failed:', err)
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [authProvider, router, redirectAfterLogin]
  )

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      await authProvider.signOut()
      setSession(null)

      // Redirect to login
      if (AuthCircuitBreaker.checkRedirect(redirectAfterLogout)) {
        router.push(redirectAfterLogout)
      }
    } catch (err) {
      console.error('[AuthContext] Sign out failed:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [authProvider, router, redirectAfterLogout])

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (email: string, redirectTo?: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const { error: resetError } = await authProvider.resetPasswordForEmail({
          email,
          redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`,
        })

        if (resetError) {
          throw new Error(resetError.message)
        }
      } catch (err) {
        console.error('[AuthContext] Password reset failed:', err)
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [authProvider]
  )

  /**
   * Update password
   */
  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const { error: updateError } = await authProvider.updatePassword({ newPassword })

        if (updateError) {
          throw new Error(updateError.message)
        }
      } catch (err) {
        console.error('[AuthContext] Password update failed:', err)
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [authProvider]
  )

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data: refreshedSession, error: refreshError } = await authProvider.refreshSession()

      if (refreshError) {
        console.error('[AuthContext] Session refresh error:', refreshError)
        setSession(null)

        // Redirect to login if refresh fails
        if (pathname !== AUTH_ROUTES.LOGIN) {
          router.push(AUTH_ROUTES.LOGIN)
        }
      } else {
        setSession(refreshedSession || null)
      }
    } catch (err) {
      console.error('[AuthContext] Failed to refresh session:', err)
      setSession(null)
    }
  }, [authProvider, pathname, router])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Permission check methods
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user?.role) return false
      return permissionService.hasPermission(user.role, permission)
    },
    [user]
  )

  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!user?.role) return false
      return permissionService.canAccessRoute(user.role, route)
    },
    [user]
  )

  const canManageUser = useCallback(
    (targetRole: string): boolean => {
      if (!user?.role) return false
      return permissionService.canManageUser(user.role, targetRole)
    },
    [user]
  )

  /**
   * Set up auth state listener
   */
  useEffect(() => {
    // Initialize auth on mount
    initializeAuth()

    // Listen to auth state changes
    const unsubscribe = authProvider.onAuthStateChange(
      (event: AuthChangeEvent, newSession: AuthSession | null) => {
        console.log('[AuthContext] Auth state changed:', event)

        switch (event) {
          case 'SIGNED_IN':
            setSession(newSession)
            break
          case 'SIGNED_OUT':
            setSession(null)
            break
          case 'TOKEN_REFRESHED':
            setSession(newSession)
            break
          case 'USER_UPDATED':
            if (newSession) {
              setSession(newSession)
            }
            break
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [authProvider, initializeAuth])

  /**
   * Set up auto refresh
   */
  useEffect(() => {
    if (!enableAutoRefresh || !session) return

    const intervalId = setInterval(() => {
      console.log('[AuthContext] Auto-refreshing session...')
      refreshSession()
    }, refreshInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enableAutoRefresh, session, refreshInterval, refreshSession])

  /**
   * Context value
   */
  const value = useMemo<AuthContextState>(
    () => ({
      // State
      session,
      user,
      isLoading,
      isAuthenticated,
      error,

      // Auth methods
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,

      // Session methods
      refreshSession,
      clearError,

      // Permission checks
      hasPermission,
      canAccessRoute,
      canManageUser,
    }),
    [
      session,
      user,
      isLoading,
      isAuthenticated,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshSession,
      clearError,
      hasPermission,
      canAccessRoute,
      canManageUser,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 *
 * Access auth context from any component
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
