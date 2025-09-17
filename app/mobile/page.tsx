import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'

export const dynamic = 'force-dynamic'

export default async function MobileHomePage() {
  // PRIORITY 3 FIX: Simplified server-side auth with minimal checks
  // Let middleware handle most auth logic, just do basic verification here
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // If middleware didn't catch auth issues but we have none, redirect
    if (userError || !user) {
      redirect('/auth/login')
    }

    // Quick profile check (don't duplicate all validation here)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email, site_id')
      .eq('id', user.id)
      .single()

    // Basic validation only
    if (profileError || !profile) {
      redirect('/auth/login')
    }

    // Role check (middleware should have caught this, but safety check)
    const canAccessMobile = ['worker', 'site_manager', 'customer_manager'].includes(profile.role)
    if (!canAccessMobile) {
      redirect('/dashboard/admin')
    }

    // Pass validated data to client wrapper
    return <MobileHomeWrapper initialProfile={profile} initialUser={user} />
  } catch (error) {
    console.error('Mobile page error:', error)
    redirect('/auth/login')
  }
}
