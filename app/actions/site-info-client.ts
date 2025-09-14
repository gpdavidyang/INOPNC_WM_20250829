import { getCurrentUserSite } from "@/app/actions/site-info"
'use client'
import { createClient } from '@/lib/supabase/client'

// This file provides client-side wrappers for server actions
// It handles session verification before calling server actions

// Import server actions - they can be called from client components

// Client-side wrapper for getCurrentUserSite that ensures session is valid before calling server action
export async function getCurrentUserSiteWithAuth() {
  const supabase = createClient()
  
  try {
    // First ensure we have a valid client session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return { success: false, error: 'No active session' }
    }
    
    // Verify the session is actually valid
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // Try to refresh the session
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshResult.session) {
        return { success: false, error: 'Session expired' }
      }
      
      // Wait a bit for cookies to propagate
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Now call the server action - it will use cookies from the session
    const result = await getCurrentUserSite()
    
    // If server action failed due to auth, try refreshing and retry once
    if (!result.success && result.error?.includes('Authentication')) {
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshResult.session && !refreshError) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const retryResult = await getCurrentUserSite()
        return retryResult
      }
    }
    
    return result
  } catch (error) {
    console.error('[SITE-INFO-CLIENT] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Client-side wrapper for getUserSiteHistory
export async function getUserSiteHistoryWithAuth() {
  const supabase = createClient()
  
  try {
    // First ensure we have a valid client session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return { success: false, error: 'No active session' }
    }
    
    // Now call the server action
    const result = await getUserSiteHistory()
    
    // If server action failed due to auth, try refreshing and retry once
    if (!result.success && result.error?.includes('Authentication')) {
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshResult.session && !refreshError) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const retryResult = await getUserSiteHistory()
        return retryResult
      }
    }
    
    return result
  } catch (error) {
    console.error('[SITE-INFO-CLIENT] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}