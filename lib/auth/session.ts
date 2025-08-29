import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createClient()
  
  try {
    // First try to get the user directly
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && !error) {
      return user
    }
    
    // If that fails, try to get and refresh the session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshData.session && !refreshError) {
        // Get user after refresh
        const { data: { user: refreshedUser } } = await supabase.auth.getUser()
        return refreshedUser
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}