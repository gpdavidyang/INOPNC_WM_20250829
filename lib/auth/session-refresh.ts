import { createClient } from '@/lib/supabase/client'

export async function refreshUserSession() {
  try {
    const supabase = createClient()
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }
    
    // Force refresh the session
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Session refresh error:', error)
      
      // If refresh fails, try to get existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      
      if (existingSession) {
        return { success: true, session: existingSession }
      }
      
      // If no session exists, clear cookies and redirect to login
      await supabase.auth.signOut()
      return { success: false, error: error.message }
    }
    
    return { success: true, session }
  } catch (error) {
    console.error('Session refresh failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Clear invalid cookies and force re-authentication
export async function clearInvalidSession() {
  try {
    // Clear all auth cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    // Redirect to login
    window.location.href = '/auth/login?message=session_expired'
  } catch (error) {
    console.error('Failed to clear invalid session:', error)
    window.location.href = '/auth/login'
  }
}

// Auto session refresh with retry logic
export async function autoRefreshSession(retryCount = 0) {
  const maxRetries = 3
  
  try {
    const result = await refreshUserSession()
    
    if (result.success) {
      return result
    }
    
    // If refresh failed and we haven't exceeded max retries
    if (retryCount < maxRetries) {
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
      return autoRefreshSession(retryCount + 1)
    }
    
    // Max retries exceeded, clear session
    await clearInvalidSession()
    return result
  } catch (error) {
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
      return autoRefreshSession(retryCount + 1)
    }
    
    await clearInvalidSession()
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Auto refresh failed' 
    }
  }
}