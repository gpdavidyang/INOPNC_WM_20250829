import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'sign-in') {
      // Test signing in from server side
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'manager@inopnc.com',
        password: 'password123'
      })
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message })
      }
      
      return NextResponse.json({ 
        success: true, 
        user: data.user?.email,
        session: !!data.session 
      })
    }
    
    if (action === 'check-session') {
      const cookieStore = cookies()
      const supabase = createClient()
      
      const allCookies = cookieStore.getAll()
      const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'))
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      return NextResponse.json({
        success: true,
        session: !!session,
        user: session?.user?.email,
        cookies: supabaseCookies.length,
        cookieNames: supabaseCookies.map(c => c.name)
      })
    }
    
    return NextResponse.json({ success: false, error: 'Unknown action' })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
