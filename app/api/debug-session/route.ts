import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(cookie => cookie.name.includes('sb-'))

    const [sessionResult, userResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ])

    const session = sessionResult.data.session
    const user = userResult.data.user || session?.user || null

    let siteAssignment: {
      siteName?: string | null
      role?: string | null
      assignedDate?: string | null
    } | null = null

    if (user) {
      const { data, error } = await supabase
        .from('site_assignments')
        .select('role, assigned_date, sites(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!error && data) {
        siteAssignment = {
          siteName: data.sites?.name ?? null,
          role: data.role ?? null,
          assignedDate: data.assigned_date ?? null,
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        total: allCookies.length,
        supabase: supabaseCookies.length,
        names: supabaseCookies.map(cookie => cookie.name),
      },
      session: {
        exists: !!session,
        user: session?.user?.email ?? null,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        error: sessionResult.error?.message ?? null,
      },
      user: {
        exists: !!user,
        email: user?.email ?? null,
        id: user?.id ?? null,
        error: userResult.error?.message ?? null,
      },
      siteAssignment,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
