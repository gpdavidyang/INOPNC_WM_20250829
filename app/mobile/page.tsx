import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'

export const dynamic = 'force-dynamic'

export default async function MobileHomePage() {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Mobile: No user, redirecting to login')
      redirect('/auth/login')
    }
    
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email, site_id')
      .eq('id', user.id)
      .single()
    
    console.log('Mobile: Profile data:', { profile, profileError })
    
    if (profileError || !profile) {
      console.log('Mobile: No profile, redirecting to login')
      redirect('/auth/login')
    }
    
    console.log('Mobile: User role is:', profile.role)
    console.log('Mobile: User ID is:', user.id)
    console.log('Mobile: User email is:', user.email)
    
    // Check if user can access mobile
    const canAccessMobile = ['worker', 'site_manager', 'customer_manager'].includes(profile.role)
    
    if (!canAccessMobile) {
      console.log('Mobile: Cannot access mobile, redirecting to admin dashboard')
      redirect('/dashboard/admin')
    }
    
    // Pass the validated profile data to avoid client-side auth loops
    return <MobileHomeWrapper initialProfile={profile} initialUser={user} />
  } catch (error) {
    console.error('Mobile page error:', error)
    redirect('/auth/login')
  }
}
