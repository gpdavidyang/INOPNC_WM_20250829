import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        {
          error: 'Session check failed',
          details: sessionError.message,
        },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        {
          error: 'No active session',
          message: 'User is not authenticated',
        },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        {
          error: 'Profile fetch failed',
          details: profileError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: session.expires_at,
      },
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
