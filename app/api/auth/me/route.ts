import { NextRequest, NextResponse } from 'next/server'
import { normalizeUserRole } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

function parseProfile(profile: any, fallbackEmail: string | null) {
  if (!profile) return null

  const nextProfile = {
    ...profile,
    email: profile.email ?? fallbackEmail,
  }

  if (typeof nextProfile.notification_preferences === 'string') {
    try {
      nextProfile.notification_preferences = JSON.parse(nextProfile.notification_preferences)
    } catch (error) {
      console.warn('[API] /auth/me profile parse error:', error)
    }
  }

  return nextProfile
}

/**
 * Client-side auth data endpoint for useUnifiedAuth hook
 * Replaces direct server-side function calls that cause memory crashes
 */
export const dynamic = 'force-dynamic'

const UI_TRACKS: Record<string, string> = {
  worker: '/mobile',
  site_manager: '/mobile',
  production_manager: '/mobile/production/production',
  customer_manager: '/mobile/partner',
  partner: '/mobile/partner',
  admin: '/dashboard/admin',
  system_admin: '/dashboard/admin',
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()

    // NOTE: This endpoint is used for client-side bootstrap and routing only.
    // Prefer `getSession()` to avoid an extra network round-trip (`auth/v1/user`) during login.
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user) {
      return NextResponse.json({ user: null, profile: null, session: null }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const normalizedRole = normalizeUserRole((profileData as any)?.role)
    const uiTrack = UI_TRACKS[normalizedRole] || '/mobile'
    const isRestricted = normalizedRole === 'customer_manager'
    const restrictedOrgId =
      (profileData as any)?.partner_company_id ?? (profileData as any)?.organization_id ?? null

    const responsePayload = {
      user,
      profile: parseProfile(profileData, user.email ?? null),
      session,
      isRestricted,
      uiTrack,
      restrictedOrgId,
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('[API] /auth/me error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch auth data',
        user: null,
        profile: null,
        session: null,
      },
      { status: 500 }
    )
  }
}
