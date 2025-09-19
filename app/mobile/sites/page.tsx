import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import SiteInfoPage from '@/modules/mobile/components/site/SiteInfoPage'
import { mockUser, mockProfile } from '@/lib/dev-auth'

export const dynamic = 'force-dynamic'

export default async function MobileSitesPage() {
  // Development bypass check
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  ) {
    console.log('🔓 [DEV] Using mock data for mobile sites page')
    return (
      <MobileLayoutWithAuth initialProfile={mockProfile as any} initialUser={mockUser as any}>
        <SiteInfoPage />
      </MobileLayoutWithAuth>
    )
  }

  // Server-side auth with minimal checks (following mobile home pattern)
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

    // Quick profile check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, email, site_id')
      .eq('id', user.id)
      .single()

    // Basic validation only
    if (profileError || !profile) {
      redirect('/auth/login')
    }

    // Role check for sites page (worker and site_manager can access)
    const canAccessMobile = ['worker', 'site_manager'].includes(profile.role)
    if (!canAccessMobile) {
      redirect('/dashboard/admin')
    }

    // Pass validated data to client wrapper with shared layout
    return (
      <MobileLayoutWithAuth initialProfile={profile} initialUser={user}>
        <SiteInfoPage />
      </MobileLayoutWithAuth>
    )
  } catch (error) {
    console.error('Mobile sites page error:', error)
    redirect('/auth/login')
  }
}
