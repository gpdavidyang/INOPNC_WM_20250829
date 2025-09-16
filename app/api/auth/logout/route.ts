import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      // Continue even if there's an error to clear cookies
    }

    // Create response with redirect
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear all auth-related cookies with comprehensive patterns
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
      'user-role',
      `sb-${projectId}-auth-token`,
      `sb-${projectId}-auth-token.0`,
      `sb-${projectId}-auth-token.1`,
    ]

    // Get the base URL for cookie domain
    const url = new URL(request.url)

    // Clear each cookie with all possible variations
    cookiesToClear.forEach(cookieName => {
      // Clear with minimal options (most compatible)
      response.cookies.set(cookieName, '', {
        maxAge: -1,
      })

      // Also clear with full options
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })

      // Clear httpOnly version
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    })

    // Add cache control headers to prevent caching of the logout response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to logout',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Support GET for direct navigation
  return POST(request)
}
