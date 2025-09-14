/**
 * useSession Hook
 *
 * Provides session management utilities and state.
 * Handles session refresh, validation, and expiry monitoring.
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/auth-context'

/**
 * Session state and utilities
 */
interface UseSessionReturn {
  // Session state
  session: any | null
  isLoading: boolean
  isAuthenticated: boolean
  isExpired: boolean
  isExpiringSoon: boolean

  // User info
  userId: string | null
  userEmail: string | null
  userRole: string | null

  // Token info
  accessToken: string | null
  expiresAt: Date | null
  expiresIn: number | null
  timeUntilExpiry: number | null

  // Actions
  refresh: () => Promise<void>
  invalidate: () => Promise<void>

  // Utilities
  getSessionAge: () => number | null
  getFormattedExpiry: () => string | null
  isSessionValid: () => boolean
}

/**
 * Format time duration to human readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)} seconds`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      : `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  return remainingHours > 0
    ? `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
    : `${days} day${days !== 1 ? 's' : ''}`
}

/**
 * useSession Hook
 *
 * @param options - Configuration options
 * @param options.warnBeforeExpiry - Time in seconds before expiry to consider "expiring soon" (default: 300)
 * @param options.autoRefreshBeforeExpiry - Time in seconds before expiry to auto-refresh (default: 60)
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const {
 *     isAuthenticated,
 *     userEmail,
 *     isExpiringSoon,
 *     refresh
 *   } = useSession()
 *
 *   if (!isAuthenticated) {
 *     return <LoginPrompt />
 *   }
 *
 *   if (isExpiringSoon) {
 *     return <SessionExpiryWarning onRefresh={refresh} />
 *   }
 *
 *   return <div>Welcome, {userEmail}!</div>
 * }
 * ```
 */
export function useSession(
  options: {
    warnBeforeExpiry?: number
    autoRefreshBeforeExpiry?: number
  } = {}
): UseSessionReturn {
  const {
    warnBeforeExpiry = 300, // 5 minutes
    autoRefreshBeforeExpiry = 60, // 1 minute
  } = options

  const { session, isLoading: authLoading, refreshSession, signOut } = useAuth()

  // Time tracking state
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [sessionStartTime] = useState(() => Date.now())

  // Update current time every second for accurate expiry tracking
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Calculate session properties
  const sessionData = useMemo(() => {
    if (!session) {
      return {
        isAuthenticated: false,
        isExpired: false,
        isExpiringSoon: false,
        userId: null,
        userEmail: null,
        userRole: null,
        accessToken: null,
        expiresAt: null,
        expiresIn: null,
        timeUntilExpiry: null,
      }
    }

    const expiresAtMs = session.expiresAt ? session.expiresAt * 1000 : null
    const expiresAt = expiresAtMs ? new Date(expiresAtMs) : null
    const now = currentTime

    const timeUntilExpiry = expiresAtMs ? Math.floor((expiresAtMs - now) / 1000) : null
    const isExpired = timeUntilExpiry !== null && timeUntilExpiry <= 0
    const isExpiringSoon =
      timeUntilExpiry !== null && timeUntilExpiry <= warnBeforeExpiry && timeUntilExpiry > 0

    return {
      isAuthenticated: true,
      isExpired,
      isExpiringSoon,
      userId: session.user?.id || null,
      userEmail: session.user?.email || null,
      userRole: session.user?.role || null,
      accessToken: session.accessToken || null,
      expiresAt,
      expiresIn: session.expiresIn || null,
      timeUntilExpiry,
    }
  }, [session, currentTime, warnBeforeExpiry])

  // Auto-refresh when close to expiry
  useEffect(() => {
    if (!sessionData.isAuthenticated || !sessionData.timeUntilExpiry) return

    if (sessionData.timeUntilExpiry <= autoRefreshBeforeExpiry && sessionData.timeUntilExpiry > 0) {
      console.log('[useSession] Auto-refreshing session before expiry...')
      refreshSession()
    }
  }, [
    sessionData.timeUntilExpiry,
    sessionData.isAuthenticated,
    autoRefreshBeforeExpiry,
    refreshSession,
  ])

  // Handle expired session
  useEffect(() => {
    if (sessionData.isExpired && sessionData.isAuthenticated) {
      console.log('[useSession] Session expired, signing out...')
      signOut()
    }
  }, [sessionData.isExpired, sessionData.isAuthenticated, signOut])

  /**
   * Manually refresh the session
   */
  const refresh = useCallback(async () => {
    await refreshSession()
  }, [refreshSession])

  /**
   * Invalidate the session (sign out)
   */
  const invalidate = useCallback(async () => {
    await signOut()
  }, [signOut])

  /**
   * Get session age in seconds
   */
  const getSessionAge = useCallback((): number | null => {
    if (!session) return null
    return Math.floor((currentTime - sessionStartTime) / 1000)
  }, [session, currentTime, sessionStartTime])

  /**
   * Get formatted expiry time
   */
  const getFormattedExpiry = useCallback((): string | null => {
    if (!sessionData.timeUntilExpiry) return null

    if (sessionData.isExpired) {
      return 'Expired'
    }

    return `Expires in ${formatDuration(sessionData.timeUntilExpiry)}`
  }, [sessionData.timeUntilExpiry, sessionData.isExpired])

  /**
   * Check if session is valid
   */
  const isSessionValid = useCallback((): boolean => {
    return sessionData.isAuthenticated && !sessionData.isExpired
  }, [sessionData.isAuthenticated, sessionData.isExpired])

  return useMemo(
    () => ({
      // Session state
      session,
      isLoading: authLoading,
      isAuthenticated: sessionData.isAuthenticated,
      isExpired: sessionData.isExpired,
      isExpiringSoon: sessionData.isExpiringSoon,

      // User info
      userId: sessionData.userId,
      userEmail: sessionData.userEmail,
      userRole: sessionData.userRole,

      // Token info
      accessToken: sessionData.accessToken,
      expiresAt: sessionData.expiresAt,
      expiresIn: sessionData.expiresIn,
      timeUntilExpiry: sessionData.timeUntilExpiry,

      // Actions
      refresh,
      invalidate,

      // Utilities
      getSessionAge,
      getFormattedExpiry,
      isSessionValid,
    }),
    [
      session,
      authLoading,
      sessionData,
      refresh,
      invalidate,
      getSessionAge,
      getFormattedExpiry,
      isSessionValid,
    ]
  )
}
