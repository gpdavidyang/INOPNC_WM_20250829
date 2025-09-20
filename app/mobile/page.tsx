import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { mockUser, mockProfile } from '@/lib/dev-auth'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function MobileHomePage() {
  // Development bypass check
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  ) {
    console.log('🔓 [DEV] Using mock data for mobile page')
    return (
      <MobileLayoutWithAuth>
        <MobileHomeWrapper initialProfile={mockProfile as any} initialUser={mockUser as any} />
      </MobileLayoutWithAuth>
    )
  }

  // PRIORITY 3 FIX: Simplified server-side auth with minimal checks
  // Let middleware handle most auth logic, just do basic verification here
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)

    // If middleware didn't catch auth issues but we have none, redirect
    if (!auth) {
      redirect('/auth/login')
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Mobile home session error:', sessionError)
    }

    // Quick profile check (don't duplicate all validation here)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, email, site_id')
      .eq('id', auth.userId)
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
    const initialUser = session?.user ?? null

    return (
      <MobileLayoutWithAuth>
        <MobileHomeWrapper initialProfile={profile} initialUser={initialUser ?? undefined} />
      </MobileLayoutWithAuth>
    )
  } catch (error) {
    console.error('Mobile page error:', error)
    redirect('/auth/login')
  }
}
