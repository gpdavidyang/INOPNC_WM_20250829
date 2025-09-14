import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-PROD-LOGIN] Testing production environment...')
    
    const supabase = createClient()
    console.log('[TEST-PROD-LOGIN] Supabase client created')
    
    // Test database connection
    const { data: testQuery, error: testError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1)
    
    console.log('[TEST-PROD-LOGIN] Database test:', { 
      hasData: !!testQuery, 
      error: testError?.message 
    })
    
    // Try to get any user for testing
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('status', 'active')
      .limit(5)
    
    console.log('[TEST-PROD-LOGIN] Sample users:', { 
      count: users?.length || 0,
      users: users?.map((u: unknown) => ({ email: u.email, role: u.role })),
      error: usersError?.message
    })
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseConnected: !testError,
      userCount: users?.length || 0,
      sampleUsers: users?.map((u: unknown) => u.email) || [],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[TEST-PROD-LOGIN] Error:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
