import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { normalizeUserRole } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logAuthEvent } from '@/lib/auth/audit'

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
      .select(
        'mfa_enabled, mfa_session_token, mfa_session_expires_at, role, organization_id, partner_company_id'
      )
      .eq('id', userId)
      .maybeSingle()

    const normalizedRole = normalizeUserRole((profile as any)?.role)
    const uiTrack = UI_TRACKS[normalizedRole] || '/mobile'
    const isRestricted = normalizedRole === 'customer_manager'
    const restrictedOrgId =
      (profile as any)?.partner_company_id ?? (profile as any)?.organization_id ?? null

    if (profile?.mfa_enabled) {
      if (!mfa_session_token) {
        await logAuthEvent('MFA_TOKEN_REQUIRED', {
          userEmail: authUser.user.email,
          success: false,
          details: { reason: 'missing_token' },
        })
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
        await logAuthEvent('MFA_TOKEN_INVALID', {
          userEmail: authUser.user.email,
          success: false,
          details: { reason: isExpired ? 'expired' : 'mismatch' },
        })
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
      await logAuthEvent('MFA_SESSION_SYNC_FAIL', {
        userEmail: authUser.user.email,
        success: false,
        details: { error: error.message },
      })
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data.session) {
      console.log('[SYNC-SESSION API] No session returned')
      return NextResponse.json({ success: false, error: 'Failed to set session' }, { status: 500 })
    }

    console.log('[SYNC-SESSION API] Session set successfully:', data.user?.email)

    if (profile?.mfa_enabled) {
      await serviceClient
        .from('profiles')
        .update({ mfa_session_token: null, mfa_session_expires_at: null })
        .eq('id', userId)
    }

    await logAuthEvent('MFA_SESSION_SYNC_SUCCESS', {
      userEmail: data.user?.email ?? authUser.user.email,
      details: { userId },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id ?? authUser.user.id,
        email: data.user?.email ?? authUser.user.email,
      },
      uiTrack,
      isRestricted,
      restrictedOrgId,
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
