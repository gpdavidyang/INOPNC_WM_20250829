import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

function parseProfile(profile: any, fallbackEmail: string | null) {
  if (!profile) return null

  const nextProfile = {
    ...profile,
    email: profile.email ?? fallbackEmail,
  }

  if (typeof nextProfile.notification_preferences === 'string') {
    try {
      nextProfile.notification_preferences = JSON.parse(
        nextProfile.notification_preferences
      )
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

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()

    const [{ data: sessionData }, { data: userData }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ])

    const session = sessionData.session
    const user = userData.user || session?.user || null

    if (!user) {
      return NextResponse.json({ user: null, profile: null, session: null }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const auth = await getAuth()

    const responsePayload = {
      user,
      profile: parseProfile(profileData, user.email ?? null),
      session,
      isRestricted: auth?.isRestricted ?? false,
      uiTrack: auth?.uiTrack ?? '/mobile',
      restrictedOrgId: auth?.restrictedOrgId ?? null,
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
