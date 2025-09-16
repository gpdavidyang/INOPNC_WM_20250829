'use client'

import { createClient } from '@/lib/supabase/client'

let syncInterval: NodeJS.Timeout | null = null
let lastSyncTime = 0
const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MIN_SYNC_DELAY = 30 * 1000 // 30 seconds minimum between syncs

/**
 * Initialize session synchronization for mobile PWA
 * This ensures the session stays fresh and profile data is available
 */
export function initSessionSync() {
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval)
  }

  // Initial sync
  syncSession()

  // Set up periodic sync
  syncInterval = setInterval(() => {
    syncSession()
  }, SYNC_INTERVAL)

  // Sync on visibility change (when app comes to foreground)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  // Sync on online status change
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
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
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline)
  }
}

/**
 * Sync session with Supabase
 */
async function syncSession() {
  const now = Date.now()

  // Prevent too frequent syncs
  if (now - lastSyncTime < MIN_SYNC_DELAY) {
    return
  }

  lastSyncTime = now

  try {
    const supabase = createClient()
    if (!supabase) {
      console.error('[Session Sync] Supabase client not available')
      return
    }

    // Try to get current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('[Session Sync] Error getting session:', error)
      return
    }

    if (!session) {
      // Try to refresh if no session
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('[Session Sync] Error refreshing session:', refreshError)
      } else if (refreshedSession) {
        console.log('[Session Sync] Session refreshed successfully')
      }
    } else {
      // Check if token needs refresh (within 5 minutes of expiry)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
      const timeUntilExpiry = expiresAt - now

      if (timeUntilExpiry < 5 * 60 * 1000) {
        // Less than 5 minutes
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession()

        if (refreshError) {
          console.error('[Session Sync] Error refreshing expiring session:', refreshError)
        } else if (refreshedSession) {
          console.log('[Session Sync] Expiring session refreshed successfully')
        }
      }
    }
  } catch (error) {
    console.error('[Session Sync] Unexpected error:', error)
  }
}

/**
 * Handle visibility change (app coming to foreground)
 */
function handleVisibilityChange() {
  if (!document.hidden) {
    // App is visible, sync session
    syncSession()
  }
}

/**
 * Handle online status change
 */
function handleOnline() {
  // Device is online, sync session
  syncSession()
}

/**
 * Force immediate session sync
 */
export async function forceSessionSync() {
  await syncSession()
}
