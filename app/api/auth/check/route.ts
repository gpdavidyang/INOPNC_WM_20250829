import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const authCookies = cookieStore
      .getAll()
      .filter(cookie => cookie.name.includes('sb-') || cookie.name.includes('supabase'))

    const supabase = createClient()

    const [sessionResult, userResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ])

    const session = sessionResult.data.session
    const user = userResult.data.user || session?.user || null

    let profile: {
      id: string
      full_name: string | null
      email: string | null
      role: string | null
      site_id: string | null
      organization_id: string | null
    } | null = null

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, site_id, organization_id')
        .eq('id', user.id)
        .maybeSingle()

      profile = profileData ?? null
    }

    const response = {
      success: !!user,
      hasAuthCookies: authCookies.length > 0,
      authCookieNames: authCookies.map(cookie => cookie.name),
      hasSession: !!session,
      sessionError: sessionResult.error?.message || null,
      hasUser: !!user,
      userError: userResult.error?.message || null,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      profile,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
