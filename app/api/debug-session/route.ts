import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'



export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'))
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const simpleAuth = await getAuthForClient(supabase)
    
    // Check site assignments if user exists
    let siteAssignment = null
    if (simpleAuth?.userId) {
      const { data, error } = await supabase
        .from('site_assignments')
        .select('*, sites(name)')
        .eq('user_id', simpleAuth.userId)
        .eq('is_active', true)
        .single()
      
      if (!error && data) {
        siteAssignment = data
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        total: allCookies.length,
        supabase: supabaseCookies.length,
        names: supabaseCookies.map(c => c.name)
      },
      session: {
        exists: !!session,
        user: session?.user?.email || simpleAuth?.email,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        error: sessionError?.message
      },
      user: {
        exists: !!simpleAuth,
        email: simpleAuth?.email,
        id: simpleAuth?.userId,
        error: null
      },
      siteAssignment: siteAssignment ? {
        siteName: siteAssignment.sites?.name,
        role: siteAssignment.role,
        assignedDate: siteAssignment.assigned_date
      } : null
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
