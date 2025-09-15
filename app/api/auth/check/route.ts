import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Check for Supabase auth cookies
    const authCookies = allCookies.filter(
      c => c.name.includes('sb-') || c.name.includes('supabase')
    )

    console.log(
      'Auth check - Found cookies:',
      authCookies.map(c => c.name)
    )

    // Try to get session using server client
    const supabase = createClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Get profile if user exists
    let profile = null
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }

    return NextResponse.json({
      success: true,
      hasAuthCookies: authCookies.length > 0,
      authCookieNames: authCookies.map(c => c.name),
      hasSession: !!session,
      sessionError: sessionError?.message || null,
      hasUser: !!user,
      userError: userError?.message || null,
      userId: user?.id || null,
      userEmail: user?.email || null,
      profile: profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
            site_id: profile.site_id,
          }
        : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
