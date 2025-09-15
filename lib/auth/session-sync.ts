/**
 * Session synchronization utilities for ensuring auth state consistency
 * between server and client components
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Force refresh the session from cookies on the client side
 * This helps maintain session continuity when navigating between pages
 */
export async function syncClientSession() {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const supabase = createClient()
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' }
    }

    // First, try to get the current session from cookies
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (session) {
      console.log('[SESSION-SYNC] Session found:', session.user?.email)
      return { success: true, session }
    }

    // If no session, try to refresh using refresh token
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession()

    if (refreshedSession) {
      console.log('[SESSION-SYNC] Session refreshed:', refreshedSession.user?.email)
      return { success: true, session: refreshedSession }
    }

    console.log('[SESSION-SYNC] No session available')
    return { success: false, error: refreshError?.message || 'No session found' }
  } catch (error) {
    console.error('[SESSION-SYNC] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Initialize session sync on page load
 * This should be called in client components that require authentication
 */
export function initSessionSync() {
  if (typeof window === 'undefined') return

  // Sync session on page load
  syncClientSession().then(result => {
    if (!result.success) {
      console.warn('[SESSION-SYNC] Initial sync failed:', result.error)
    }
  })

  // Listen for visibility changes to refresh session when tab becomes active
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncClientSession()
    }
  })

  // Listen for focus events
  window.addEventListener('focus', () => {
    syncClientSession()
  })
}

/**
 * Manual session refresh utility
 */
export async function refreshAuthSession() {
  const supabase = createClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession()

  if (error) {
    throw error
  }

  return session
}
