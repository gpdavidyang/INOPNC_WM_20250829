import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { mockUser, mockProfile } from '@/lib/dev-auth'

export const dynamic = 'force-dynamic'

export default async function MobileHomePage() {
  // Development bypass check
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  ) {
    console.log('🔓 [DEV] Using mock data for mobile page')
    return (
      <MobileLayoutWithAuth initialProfile={mockProfile as any} initialUser={mockUser as any}>
        <MobileHomeWrapper initialProfile={mockProfile as any} initialUser={mockUser as any} />
      </MobileLayoutWithAuth>
    )
  }

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
      .select('id, role, full_name, email, site_id')
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

    // Pass validated data to client wrapper with AuthProvider at layout level
    return (
      <MobileLayoutWithAuth initialProfile={profile} initialUser={user}>
        <MobileHomeWrapper initialProfile={profile} initialUser={user} />
      </MobileLayoutWithAuth>
    )
  } catch (error) {
    console.error('Mobile page error:', error)
    redirect('/auth/login')
  }
}
