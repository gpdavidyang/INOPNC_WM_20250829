'use client'

import { createClient } from '@/lib/supabase/client'

let syncInterval: NodeJS.Timeout | null = null
let lastSyncTime = 0
const SYNC_INTERVAL = 30 * 60 * 1000 // 30 minutes (production optimized)
const MIN_SYNC_DELAY = 5 * 60 * 1000 // 5 minutes minimum between syncs (production optimized)

/**
 * Initialize session synchronization for mobile PWA
 * OPTIMIZED: Respects server validation and reduces over-validation
 */
export function initSessionSync() {
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval)
  }

  // CRITICAL FIX: Don't perform initial sync immediately
  // Trust that AuthProvider has already validated the session from server data
  console.log('[Session Sync] Initialized - trusting AuthProvider validation')

  // Set up periodic sync (reduced frequency)
  syncInterval = setInterval(() => {
    syncSession()
  }, SYNC_INTERVAL)

  // PRODUCTION: Only sync on visibility change if session is very stale
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleOptimizedVisibilityChange)
  }

  // PRODUCTION: Only sync on online if we were offline for an extended period
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOptimizedOnline)
  }
}

/**
 * Clean up session sync
 */
export function cleanupSessionSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }

  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleOptimizedVisibilityChange)
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOptimizedOnline)
  }
}

/**
 * Sync session with Supabase - OPTIMIZED to respect server validation
 */
async function syncSession() {
  const now = Date.now()

  // Prevent too frequent syncs
  if (now - lastSyncTime < MIN_SYNC_DELAY) {
    console.log('[Session Sync] Skipping - too frequent (rate limited)')
    return
  }

  lastSyncTime = now

  try {
    const supabase = createClient()
    if (!supabase) {
      console.error('[Session Sync] Supabase client not available')
      return
    }

    // OPTIMIZED: First check if we have a current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('[Session Sync] Error getting session:', error)
      return
    }

    if (!session) {
      console.log('[Session Sync] No session found - user likely signed out')
      return // Don't aggressively refresh when no session exists
    }

    // CRITICAL FIX: Only refresh if token is actually close to expiry
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const timeUntilExpiry = expiresAt - now

    // Only refresh within 2 minutes of expiry (production optimized)
    if (timeUntilExpiry < 2 * 60 * 1000 && timeUntilExpiry > 0) {
      console.log(
        '[Session Sync] Token expires in',
        Math.round(timeUntilExpiry / 60000),
        'minutes - refreshing'
      )

      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('[Session Sync] Error refreshing expiring session:', refreshError)
      } else if (refreshedSession) {
        console.log('[Session Sync] Token refreshed successfully')
      }
    } else {
      console.log(
        '[Session Sync] Session healthy - expires in',
        Math.round(timeUntilExpiry / 60000),
        'minutes'
      )
    }
  } catch (error) {
    console.error('[Session Sync] Unexpected error:', error)
  }
}

/**
 * Handle visibility change (app coming to foreground) - OPTIMIZED
 */
function handleOptimizedVisibilityChange() {
  if (!document.hidden) {
    const timeSinceLastSync = Date.now() - lastSyncTime

    // Only sync if app was hidden for more than 10 minutes
    if (timeSinceLastSync > 10 * 60 * 1000) {
      console.log('[Session Sync] App visible after long period - syncing session')
      syncSession()
    } else {
      console.log('[Session Sync] App visible - session likely still fresh')
    }
  }
}

/**
 * Handle online status change - OPTIMIZED
 */
function handleOptimizedOnline() {
  const timeSinceLastSync = Date.now() - lastSyncTime

  // Only sync if we were offline for more than 5 minutes
  if (timeSinceLastSync > 5 * 60 * 1000) {
    console.log('[Session Sync] Back online after extended period - syncing session')
    syncSession()
  } else {
    console.log('[Session Sync] Back online - session likely still fresh')
  }
}

/**
 * Force immediate session sync
 */
export async function forceSessionSync() {
  await syncSession()
}
