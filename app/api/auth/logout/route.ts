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

    // Clear all auth-related cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
    ]

    // Get the base URL for cookie domain
    const url = new URL(request.url)
    const domain = url.hostname === 'localhost' ? 'localhost' : url.hostname

    cookiesToClear.forEach(cookieName => {
      // Clear with various path combinations
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })

      // Also clear with project-specific prefix
      response.cookies.set(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
        '',
        {
          path: '/',
          expires: new Date(0),
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        }
      )
    })

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
