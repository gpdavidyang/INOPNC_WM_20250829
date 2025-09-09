'use client'

import { useEffect, useState } from 'react'
import { createClient, forceSessionRefresh } from '@/lib/supabase/client'

interface AutoLoginResult {
  isLoading: boolean
  isAuthenticated: boolean
  user: any | null
  error: string | null
}

/**
 * Custom hook for auto-login functionality with proper session synchronization
 * 
 * This hook handles:
 * 1. Checking existing session
 * 2. Auto-login if no session exists
 * 3. Proper session synchronization between client and server
 * 4. Circuit breaker to prevent infinite loops
 */
export function useAutoLogin(
  enabled: boolean = true,
  credentials?: { email: string; password: string }
): AutoLoginResult {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasRunOnce, setHasRunOnce] = useState(false) // 한 번만 실행되도록 보장
  
  useEffect(() => {
    if (!enabled || hasRunOnce) {
      setIsLoading(false)
      return
    }
    
    const performAutoLogin = async () => {
      const supabase = createClient()
      
      try {
        // console.log('[USE-AUTO-LOGIN] Checking existing session...')
        
        // First check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session && session.user) {
          // console.log('[USE-AUTO-LOGIN] Existing session found:', session.user.email)
          
          // Verify the session is valid
          const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
          
          if (verifiedUser && !verifyError) {
            // console.log('[USE-AUTO-LOGIN] Session verified')
            setIsAuthenticated(true)
            setUser(verifiedUser)
            setIsLoading(false)
            return
          }
        }
        
        // Check if auto-login is disabled
        const autoLoginDisabled = localStorage.getItem('inopnc-auto-login-disabled')
        if (autoLoginDisabled === 'true') {
          // console.log('[USE-AUTO-LOGIN] Auto-login is disabled')
          setIsLoading(false)
          return
        }
        
        // CRITICAL: Strong circuit breaker to prevent infinite loops
        const lastAttempt = localStorage.getItem('inopnc-last-auto-login')
        const attemptCount = parseInt(localStorage.getItem('inopnc-auto-login-attempts') || '0')
        
        if (lastAttempt) {
          const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt)
          
          // Progressive backoff: 30s after first attempt, 5min after multiple attempts
          const cooldownTime = attemptCount > 3 ? 300000 : 30000 // 5min or 30s
          
          if (timeSinceLastAttempt < cooldownTime) {
            // console.log(`[USE-AUTO-LOGIN] Cooldown active (${Math.ceil((cooldownTime - timeSinceLastAttempt) / 1000)}s remaining)`)
            setIsLoading(false)
            return
          }
        }
        
        // Block excessive attempts
        if (attemptCount > 5) {
          // console.log('[USE-AUTO-LOGIN] Too many attempts, auto-login disabled')
          localStorage.setItem('inopnc-auto-login-disabled', 'true')
          setIsLoading(false)
          return
        }
        
        // Use provided credentials or default test credentials
        const loginCredentials = credentials || {
          email: 'manager@inopnc.com',
          password: 'password123'
        }
        
        // console.log('[USE-AUTO-LOGIN] Attempting auto-login...')
        localStorage.setItem('inopnc-last-auto-login', Date.now().toString())
        localStorage.setItem('inopnc-auto-login-attempts', (attemptCount + 1).toString())
        
        // Perform login
        const { data, error: loginError } = await supabase.auth.signInWithPassword(loginCredentials)
        
        if (loginError || !data.session) {
          console.error('[USE-AUTO-LOGIN] Login failed:', loginError)
          setError(loginError?.message || 'Login failed')
          setIsLoading(false)
          return
        }
        
        // console.log('[USE-AUTO-LOGIN] Login successful:', data.user?.email)
        
        // CRITICAL: Sync session with server
        // console.log('[USE-AUTO-LOGIN] Syncing session with server...')
        
        try {
          const syncResponse = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            }),
            credentials: 'include'
          })
          
          const syncResult = await syncResponse.json()
          
          if (syncResult.success) {
            // console.log('[USE-AUTO-LOGIN] Session synced successfully')
            
            // CRITICAL FIX: Wait for session to propagate to client
            await new Promise(resolve => setTimeout(resolve, 2000)) // Even longer wait for complete propagation
            
            // Verify session is available in the client
            // console.log('[USE-AUTO-LOGIN] Verifying client session...')
            const finalSupabase = createClient()
            const { data: { session: finalSession } } = await finalSupabase.auth.getSession()
            
            if (finalSession) {
              // console.log('[USE-AUTO-LOGIN] ✅ Client session confirmed:', finalSession.user?.email)
            } else {
              console.warn('[USE-AUTO-LOGIN] ⚠️ Client session not available yet, but login was successful')
              // Don't fail here - the session might be available later when components check it
            }
          } else {
            console.warn('[USE-AUTO-LOGIN] Session sync failed:', syncResult.error)
          }
        } catch (syncError) {
          console.error('[USE-AUTO-LOGIN] Session sync error:', syncError)
        }
        
        // Set authenticated state
        setIsAuthenticated(true)
        setUser(data.user)
        setError(null)
        
        // Store success flag and reset attempt counter
        localStorage.setItem('inopnc-login-success', 'true')
        localStorage.removeItem('inopnc-auto-login-attempts')
        
        // CRITICAL: Disable auto-login after successful login to prevent repeated attempts
        localStorage.setItem('inopnc-auto-login-disabled', 'true')
        // console.log('[USE-AUTO-LOGIN] Auto-login disabled after successful login')
        
      } catch (err) {
        console.error('[USE-AUTO-LOGIN] Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
        setHasRunOnce(true) // 실행 완료 표시
      }
    }
    
    // Delay execution slightly to avoid race conditions
    const timer = setTimeout(performAutoLogin, 500)
    
    return () => clearTimeout(timer)
  }, [enabled, credentials?.email, credentials?.password])
  
  return {
    isLoading,
    isAuthenticated,
    user,
    error
  }
}

/**
 * Force session synchronization after manual login
 * Call this after any manual authentication to ensure server-side session is synced
 */
export async function syncSessionAfterAuth(session: any) {
  if (!session || !session.access_token || !session.refresh_token) {
    console.error('[SYNC-SESSION] Invalid session provided')
    return { success: false, error: 'Invalid session' }
  }
  
  try {
    // console.log('[SYNC-SESSION] Syncing session with server...')
    
    const response = await fetch('/api/auth/sync-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }),
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.success) {
      // console.log('[SYNC-SESSION] Session synced successfully')
      
      // CRITICAL FIX: Wait for cookies to propagate
      // The server has set the cookies, but the browser needs time to process them
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Verify that cookies are now accessible from the client
      if (typeof document !== 'undefined') {
        const cookies = document.cookie
        const hasAuthCookies = cookies.includes('sb-')
        // console.log('[SYNC-SESSION] Auth cookies present after sync:', hasAuthCookies)
        
        if (!hasAuthCookies) {
          console.warn('[SYNC-SESSION] Warning: Auth cookies not found after sync')
        }
      }
      
      return { success: true }
    } else {
      console.error('[SYNC-SESSION] Sync failed:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('[SYNC-SESSION] Sync error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}