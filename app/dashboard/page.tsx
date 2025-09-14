import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/auth/login')
    }
    
    // Get user profile to determine role-based redirect
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      // If profile doesn't exist or error, go to admin by default
      redirect('/dashboard/admin')
    }
    
    // Role-based routing
    switch (profile.role) {
      case 'system_admin':
        redirect('/dashboard/admin')
        break
      case 'site_manager':
        redirect('/mobile')
        break
      case 'worker':
        redirect('/mobile')
        break
      case 'customer_manager':
        redirect('/partner/dashboard')
        break
      default:
        // Default to admin dashboard
        redirect('/dashboard/admin')
        break
    }
  } catch (error) {
    console.error('Dashboard redirect error:', error)
    // Fallback to admin dashboard on error
    redirect('/dashboard/admin')
  }
}