import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'))
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Check site assignments if user exists
    let siteAssignment = null
    if (user) {
      const { data, error } = await supabase
        .from('site_assignments')
        .select('*, sites(name)')
        .eq('user_id', user.id)
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
        user: session?.user?.email,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        email: user?.email,
        id: user?.id,
        error: userError?.message
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