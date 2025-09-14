
/**
 * Admin authentication wrapper for admin pages
 * Ensures only admin users (본사관리자/시스템관리자) can access admin functionality
 * Note: admin role now includes all system_admin privileges
 */
export async function requireAdminAuth(): Promise<{ user: unknown; profile: Profile }> {
  const supabase = createClient()
  
  // Get authenticated user
  const user = await getAuthenticatedUser()
  
  if (!user) {
    console.error('No authenticated user found')
    redirect('/auth/login')
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    redirect('/auth/login')
  }

  // Check if user has admin privileges (admin = 본사관리자/시스템관리자)
  if (profile.role !== 'admin' && profile.role !== 'system_admin') {
    console.warn(`User ${user.email} attempted to access admin area with role: ${profile.role}`)
    redirect('/dashboard')
  }

  return { user, profile }
}

/**
 * Check if user has system admin privileges
 * @deprecated Use isAdmin() instead - admin role now includes all system privileges
 */
export function isSystemAdmin(profile: Profile): boolean {
  return profile.role === 'admin' || profile.role === 'system_admin'
}

/**
 * Check if user has admin privileges (본사관리자/시스템관리자)
 * admin role now includes all system_admin privileges
 */
export function isAdmin(profile: Profile): boolean {
  return profile.role === 'admin' || profile.role === 'system_admin'
}