'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Session Synchronization Helper
 * 
 * This module ensures proper session cookie synchronization between
 * client-side authentication and server-side actions.
 * 
 * The core issue: When authenticating on the client side, Supabase sets
 * cookies that need to be accessible to server actions. However, there
 * can be a delay or failure in this propagation.
 * 
 * Solution: After client-side auth, we force a session refresh and
 * verify cookies are properly set before proceeding with data fetches.
 */

// Create a raw client specifically for session operations
function createSessionClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Use document.cookie directly for immediate cookie access
        getAll() {
          const cookies: { name: string; value: string }[] = []
          if (typeof document !== 'undefined') {
            document.cookie.split(';').forEach(cookie => {
              const [name, value] = cookie.trim().split('=')
              if (name && value) {
                cookies.push({ name, value: decodeURIComponent(value) })
              }
            })
          }
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document !== 'undefined') {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${encodeURIComponent(value)}`
              
              if (options?.maxAge) {
                cookieString += `; max-age=${options.maxAge}`
              }
              if (options?.expires) {
                cookieString += `; expires=${options.expires.toUTCString()}`
              }
              if (options?.path) {
                cookieString += `; path=${options.path}`
              }
              if (options?.domain) {
                cookieString += `; domain=${options.domain}`
              }
              if (options?.secure) {
                cookieString += '; secure'
              }
              if (options?.sameSite) {
                cookieString += `; samesite=${options.sameSite}`
              }
              
              document.cookie = cookieString
            })
          }
        }
      }
    }
  )
}

/**
 * Ensure session is properly synchronized after authentication
 * 
 * This function should be called after any authentication operation
 * (signIn, signUp, signOut) to ensure cookies are properly set
 * for server-side actions.
 */
export async function syncSession() {
  const client = createSessionClient()
  
  try {
    console.log('[SESSION-SYNC] Starting session synchronization...')
    
    // First, get the current session
    const { data: { session }, error: sessionError } = await client.auth.getSession()
    
    if (sessionError) {
      console.error('[SESSION-SYNC] Session error:', sessionError)
      return { success: false, error: sessionError.message }
    }
    
    if (!session) {
      console.log('[SESSION-SYNC] No session to sync')
      return { success: false, error: 'No active session' }
    }
    
    console.log('[SESSION-SYNC] Session found:', session.user?.email)
    
    // Force a session refresh to ensure cookies are properly set
    const { data: { session: refreshedSession }, error: refreshError } = 
      await client.auth.refreshSession()
    
    if (refreshError) {
      console.error('[SESSION-SYNC] Refresh error:', refreshError)
      return { success: false, error: refreshError.message }
    }
    
    if (!refreshedSession) {
      console.log('[SESSION-SYNC] Refresh failed to return session')
      return { success: false, error: 'Session refresh failed' }
    }
    
    console.log('[SESSION-SYNC] Session refreshed successfully')
    
    // Verify the session is accessible
    const { data: { user }, error: userError } = await client.auth.getUser()
    
    if (userError || !user) {
      console.error('[SESSION-SYNC] User verification failed:', userError)
      return { success: false, error: 'Session verification failed' }
    }
    
    console.log('[SESSION-SYNC] Session verified for user:', user.email)
    
    // Check if cookies are actually set
    if (typeof document !== 'undefined') {
      const cookies = document.cookie
      const hasAuthCookies = cookies.includes('sb-') // Supabase cookies start with sb-
      console.log('[SESSION-SYNC] Auth cookies present:', hasAuthCookies)
      
      if (!hasAuthCookies) {
        console.warn('[SESSION-SYNC] Warning: Auth cookies not found in document.cookie')
      }
    }
    
    return { success: true, session: refreshedSession }
  } catch (error) {
    console.error('[SESSION-SYNC] Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Perform authenticated action with automatic session sync
 * 
 * This wrapper ensures the session is synchronized before
 * executing any server action that requires authentication.
 */
export async function withSessionSync<T>(
  action: () => Promise<T>
): Promise<T> {
  // First sync the session
  const syncResult = await syncSession()
  
  if (!syncResult.success) {
    throw new Error(`Session sync failed: ${syncResult.error}`)
  }
  
  // Wait a bit for cookies to propagate
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Now execute the action
  return action()
}

/**
 * Sign in with automatic session synchronization
 */
export async function signInWithSync(
  email: string, 
  password: string
) {
  const client = createSessionClient()
  
  try {
    console.log('[SESSION-SYNC] Signing in with sync...')
    
    // Perform sign in
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('[SESSION-SYNC] Sign in error:', error)
      return { success: false, error: error.message }
    }
    
    if (!data.session) {
      console.error('[SESSION-SYNC] No session returned from sign in')
      return { success: false, error: 'Authentication failed' }
    }
    
    console.log('[SESSION-SYNC] Sign in successful:', data.user?.email)
    
    // Wait for cookies to be set
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Now sync the session
    const syncResult = await syncSession()
    
    if (!syncResult.success) {
      console.warn('[SESSION-SYNC] Session sync failed after sign in:', syncResult.error)
      // Don't fail the sign in, just warn
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('[SESSION-SYNC] Sign in with sync error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}