import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = createClient()
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Dashboard: No authenticated user, redirecting to login')
      redirect('/auth/login')
    }
    
    // Get user profile for role-based routing
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.log('Dashboard: Profile not found, redirecting to admin')
      redirect('/dashboard/admin')
    }
    
    // Role-based redirect with proper logging
    console.log(`Dashboard: User ${profile.full_name} (${profile.role}) accessing /dashboard`)
    
    // Redirect based on user role - but only redirect once to prevent loops
    if (profile.role === 'system_admin') {
      console.log('Dashboard: Redirecting system_admin to /dashboard/admin')
      redirect('/dashboard/admin')
    } else if (['site_manager', 'worker', 'customer_manager'].includes(profile.role)) {
      console.log(`Dashboard: Redirecting ${profile.role} to /mobile`)  
      redirect('/mobile')
    } else {
      console.log('Dashboard: Unknown role, defaulting to admin')
      redirect('/dashboard/admin')
    }
    
  } catch (error) {
    console.error('Dashboard: Redirect error occurred:', error)
    redirect('/dashboard/admin')
  }
}