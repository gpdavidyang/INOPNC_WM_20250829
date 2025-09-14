import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleBasedRoute, AUTH_ROUTES } from '@/lib/auth/routing'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = createClient()

    // Check user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('[Dashboard] No authenticated user, redirecting to login')
      redirect(AUTH_ROUTES.LOGIN)
    }

    // Get user profile for role-based routing
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('[Dashboard] Profile not found, redirecting to admin')
      redirect(AUTH_ROUTES.DASHBOARD.ADMIN)
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
    redirect(AUTH_ROUTES.DASHBOARD.ADMIN)
  } catch (error) {
    console.error('[Dashboard] Error occurred:', error)
    // Use centralized route instead of hard-coded path
    redirect(AUTH_ROUTES.DASHBOARD.ADMIN)
  }
}
