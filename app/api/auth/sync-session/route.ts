import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

/**
 * Session Sync API Endpoint
 *
 * This endpoint is called after client-side authentication to ensure
 * the session cookies are properly synchronized with the server.
 *
 * It forces a server-side session refresh which ensures cookies are
 * properly set in the response headers for subsequent server actions.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SYNC-SESSION API] Starting session sync...')

    // Get the access token and refresh token from the request body
    const body = await request.json()
    const { access_token, refresh_token, mfa_session_token } = body

    if (!access_token || !refresh_token) {
      console.log('[SYNC-SESSION API] Missing tokens')
      return NextResponse.json({ success: false, error: 'Missing tokens' }, { status: 400 })
    }

    console.log('[SYNC-SESSION API] Received tokens, setting session...')

    // Create server client
    const serviceClient = createServiceRoleClient()
    const supabase = createClient()

    const { data: authUser, error: authError } = await serviceClient.auth.getUser(access_token)
    if (authError || !authUser.user) {
      console.error('[SYNC-SESSION API] Invalid access token for MFA check')
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const userId = authUser.user.id

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('mfa_enabled, mfa_session_token, mfa_session_expires_at')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.mfa_enabled) {
      if (!mfa_session_token) {
        return NextResponse.json(
          { success: false, error: 'MFA 인증이 필요합니다.' },
          { status: 428 }
        )
      }

      const isExpired =
        profile.mfa_session_expires_at &&
        new Date(profile.mfa_session_expires_at).getTime() < Date.now()

      if (
        !profile.mfa_session_token ||
        profile.mfa_session_token !== mfa_session_token ||
        isExpired
      ) {
        return NextResponse.json(
          { success: false, error: 'MFA 세션이 만료되었거나 올바르지 않습니다.' },
          { status: 428 }
        )
      }
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('[SYNC-SESSION API] Set session error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data.session) {
      console.log('[SYNC-SESSION API] No session returned')
      return NextResponse.json({ success: false, error: 'Failed to set session' }, { status: 500 })
    }

    console.log('[SYNC-SESSION API] Session set successfully:', data.user?.email)

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error('[SYNC-SESSION API] User verification failed', userError)
      return NextResponse.json(
        { success: false, error: 'Session verification failed' },
        { status: 500 }
      )
    }

    console.log('[SYNC-SESSION API] Session verified for user:', userData.user.email)

    if (profile?.mfa_enabled) {
      await serviceClient
        .from('profiles')
        .update({ mfa_session_token: null, mfa_session_expires_at: null })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
    })
  } catch (error) {
    console.error('[SYNC-SESSION API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check current server-side session status
 */
export async function GET() {
  try {
    const supabase = createClient()

    const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] =
      await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()])

    const session = sessionData.session
    const user = userData.user || session?.user || null

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email ?? null,
      sessionError: sessionError?.message,
      userError: userError?.message ?? null,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
