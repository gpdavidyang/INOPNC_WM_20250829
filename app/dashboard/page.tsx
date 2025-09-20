import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

// Role-based routing logic
function getRoleBasedRoute(role: string): string {
  const roleRoutes: Record<string, string> = {
    system_admin: '/dashboard/admin',
    admin: '/dashboard/admin',
    customer_manager: '/partner/dashboard',
    partner: '/partner/dashboard',
    site_manager: '/mobile',
    worker: '/mobile',
  }

  return roleRoutes[role] || '/dashboard/admin'
}

export default async function DashboardPage() {
  try {
    const supabase = createClient()

    // Check user authentication
    const auth = await getAuthForClient(supabase)

    if (!auth) {
      console.log('[Dashboard] No authenticated user, redirecting to login')
      redirect('/auth/login')
    }

    // Get user profile for role-based routing
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', auth.userId)
      .single()

    if (profileError || !profile) {
      console.log('[Dashboard] Profile not found, redirecting to admin')
      redirect('/dashboard/admin')
    }

    // Use centralized routing logic
    const targetRoute = getRoleBasedRoute(profile.role)

    console.log(`[Dashboard] User ${profile.full_name} (${profile.role}) -> ${targetRoute}`)

    // Only redirect if we're not already at the target route
    // This prevents redirect loops at the dashboard level
    if (targetRoute !== '/dashboard') {
      redirect(targetRoute)
    }

    // If somehow we reach here (shouldn't happen), redirect to admin
    redirect('/dashboard/admin')
  } catch (error) {
    console.error('[Dashboard] Error occurred:', error)
    redirect('/dashboard/admin')
  }
}
