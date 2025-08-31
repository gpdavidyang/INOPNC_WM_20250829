import { createClient } from './client'

export interface SessionBridgeResult {
  success: boolean
  session?: any
  error?: string
}

export async function bridgeSession(): Promise<SessionBridgeResult> {
  try {
    console.log('🌉 [SESSION-BRIDGE] Attempting to bridge session from server cookies...')
    
    const response = await fetch('/api/auth/bridge-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('🌉 [SESSION-BRIDGE] Bridge failed:', errorData.error || 'Unknown error')
      return { 
        success: false, 
        error: errorData.error || `HTTP ${response.status}` 
      }
    }
    
    const { session } = await response.json()
    
    if (!session) {
      console.log('🌉 [SESSION-BRIDGE] No session data returned')
      return { success: false, error: 'No session data' }
    }
    
    // CRITICAL FIX: Reset client first to ensure fresh instance
    console.log('🌉 [SESSION-BRIDGE] Resetting client before setting session...')
    const { resetClient } = await import('./client')
    resetClient()
    
    // Create fresh client
    const supabase = createClient()
    
    // Use setSession to properly set cookies through Supabase's mechanisms
    console.log('🌉 [SESSION-BRIDGE] Setting session with fresh client...')
    const { data: setData, error: setError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })
    
    if (setError) {
      console.error('🌉 [SESSION-BRIDGE] setSession failed:', setError.message)
      return { success: false, error: setError.message }
    }
    
    console.log('🌉 [SESSION-BRIDGE] setSession completed, data:', setData ? 'present' : 'null')
    
    // Wait for everything to settle
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log('✅ [SESSION-BRIDGE] Session bridged successfully for:', session.user?.email)
    
    // Verify the session is now accessible
    const { data: { session: verifiedSession }, error: verifyError } = await supabase.auth.getSession()
    
    if (verifyError || !verifiedSession) {
      console.error('🌉 [SESSION-BRIDGE] Session verification failed after bridge:', verifyError)
      
      // Try one more time with a completely fresh client
      const { resetClient } = await import('./client')
      resetClient()
      const freshSupabase = createClient()
      const { data: { session: retrySession } } = await freshSupabase.auth.getSession()
      
      if (retrySession) {
        console.log('✅ [SESSION-BRIDGE] Session verified with fresh client:', retrySession.user?.email)
        return { success: true, session: retrySession }
      }
      
      return { success: false, error: 'Session verification failed' }
    }
    
    console.log('✅ [SESSION-BRIDGE] Session verified after bridge:', verifiedSession.user?.email)
    return { success: true, session: verifiedSession }
    
  } catch (error) {
    console.error('🌉 [SESSION-BRIDGE] Bridge error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function hasSupabaseCookies(): boolean {
  if (typeof document === 'undefined') {
    console.log('🔄 [SESSION-BRIDGE] Server-side context detected, skipping cookie check')
    return false
  }
  
  const cookies = document.cookie
  console.log('🔄 [SESSION-BRIDGE] Checking cookies:', cookies ? 'found' : 'none')
  
  // More comprehensive cookie detection for Supabase auth
  const hasAuth = cookies.includes('supabase-auth-token') || 
                  cookies.includes('sb-') ||
                  cookies.includes('supabase.auth.token') ||
                  cookies.includes('auth-token') ||
                  cookies.includes('access_token') ||
                  cookies.includes('refresh_token')
  
  console.log('🔄 [SESSION-BRIDGE] Authentication cookies present:', hasAuth)
  return hasAuth
}

export async function ensureClientSession(): Promise<SessionBridgeResult> {
  const supabase = createClient()
  
  try {
    // First check if we already have a session
    const { data: { session: existingSession } } = await supabase.auth.getSession()
    
    if (existingSession) {
      console.log('✅ [SESSION-BRIDGE] Client session already exists:', existingSession.user?.email)
      return { success: true, session: existingSession }
    }
    
    // Check if there are any Supabase authentication cookies before attempting bridge
    if (!hasSupabaseCookies()) {
      console.log('🔄 [SESSION-BRIDGE] No authentication cookies found, skipping bridge')
      return { success: false, error: 'No authentication cookies' }
    }
    
    // If no session but cookies exist, try to bridge from server
    console.log('🔄 [SESSION-BRIDGE] No client session but cookies found, attempting bridge...')
    return await bridgeSession()
    
  } catch (error) {
    console.error('🌉 [SESSION-BRIDGE] Ensure session error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}