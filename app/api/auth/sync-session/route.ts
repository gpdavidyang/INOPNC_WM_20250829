import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


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
    const { access_token, refresh_token } = body
    
    if (!access_token || !refresh_token) {
      console.log('[SYNC-SESSION API] Missing tokens')
      return NextResponse.json(
        { success: false, error: 'Missing tokens' },
        { status: 400 }
      )
    }
    
    console.log('[SYNC-SESSION API] Received tokens, setting session...')
    
    // Create server client
    const supabase = createClient()
    
    // Set the session on the server side
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })
    
    if (error) {
      console.error('[SYNC-SESSION API] Set session error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    if (!data.session) {
      console.log('[SYNC-SESSION API] No session returned')
      return NextResponse.json(
        { success: false, error: 'Failed to set session' },
        { status: 500 }
      )
    }
    
    console.log('[SYNC-SESSION API] Session set successfully:', data.user?.email)
    
    // Verify the session is accessible
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[SYNC-SESSION API] User verification failed:', userError)
      return NextResponse.json(
        { success: false, error: 'Session verification failed' },
        { status: 500 }
      )
    }
    
    console.log('[SYNC-SESSION API] Session verified for user:', user.email)
    
    // Return success with user info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('[SYNC-SESSION API] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
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
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email,
      sessionError: sessionError?.message,
      userError: userError?.message
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
