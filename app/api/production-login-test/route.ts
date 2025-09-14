
export async function GET(request: NextRequest) {
  try {
    console.log('[PROD-LOGIN-TEST] Starting production login test...')
    
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[PROD-LOGIN-TEST] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlStart: supabaseUrl?.substring(0, 30) + '...',
      keyStart: supabaseAnonKey?.substring(0, 20) + '...'
    })
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      }, { status: 500 })
    }
    
    // Test Supabase client creation
    let supabase
    try {
      supabase = createClient()
      console.log('[PROD-LOGIN-TEST] Supabase client created successfully')
    } catch (clientError) {
      console.error('[PROD-LOGIN-TEST] Failed to create Supabase client:', clientError)
      return NextResponse.json({
        error: 'Failed to create Supabase client',
        details: clientError instanceof Error ? clientError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Test auth connection
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('[PROD-LOGIN-TEST] Auth session test:', {
        hasSession: !!sessionData?.session,
        error: sessionError?.message
      })
      
      if (sessionError) {
        return NextResponse.json({
          error: 'Auth session test failed',
          details: sessionError.message
        }, { status: 500 })
      }
    } catch (authError) {
      console.error('[PROD-LOGIN-TEST] Auth connection failed:', authError)
      return NextResponse.json({
        error: 'Auth connection failed',
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Test database connection
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)
      
      console.log('[PROD-LOGIN-TEST] Database connection test:', {
        hasData: !!data,
        dataCount: data?.length || 0,
        error: error?.message
      })
      
      if (error) {
        return NextResponse.json({
          error: 'Database connection failed',
          details: error.message,
          code: error.code
        }, { status: 500 })
      }
    } catch (dbError) {
      console.error('[PROD-LOGIN-TEST] Database test failed:', dbError)
      return NextResponse.json({
        error: 'Database test failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Test a simple login attempt (without actual credentials)
    try {
      // This should fail with "Invalid login credentials" which confirms auth is working
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@invalid.com',
        password: 'invalid'
      })
      
      console.log('[PROD-LOGIN-TEST] Auth test result:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message
      })
      
      // We expect this to fail with "Invalid login credentials"
      if (error && error.message === 'Invalid login credentials') {
        console.log('[PROD-LOGIN-TEST] ✅ Authentication system is working properly')
      } else if (error) {
        return NextResponse.json({
          error: 'Unexpected auth error',
          details: error.message
        }, { status: 500 })
      } else {
        // This shouldn't happen with invalid credentials
        return NextResponse.json({
          error: 'Unexpected success with invalid credentials',
          details: 'Authentication system may be misconfigured'
        }, { status: 500 })
      }
    } catch (loginError) {
      console.error('[PROD-LOGIN-TEST] Login test failed:', loginError)
      return NextResponse.json({
        error: 'Login test failed',
        details: loginError instanceof Error ? loginError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'All production login tests passed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        environmentVariables: 'passed',
        supabaseClient: 'passed',
        authConnection: 'passed',
        databaseConnection: 'passed',
        authenticationSystem: 'passed'
      }
    })
    
  } catch (error) {
    console.error('[PROD-LOGIN-TEST] Overall test failed:', error)
    return NextResponse.json({
      error: 'Production login test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PROD-LOGIN-TEST] Testing actual login credentials...')
    
    const body = await request.json()
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password required'
      }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Test actual login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('[PROD-LOGIN-TEST] Login attempt result:', {
      email,
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message,
      errorName: error?.name
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          code: error.status,
          name: error.name
        }
      })
    }
    
    if (data?.user) {
      // Test profile lookup
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .eq('id', data.user.id)
          .single()
        
        console.log('[PROD-LOGIN-TEST] Profile lookup:', {
          hasProfile: !!profile,
          profileError: profileError?.message
        })
        
        return NextResponse.json({
          success: true,
          message: 'Login test successful',
          user: {
            id: data.user.id,
            email: data.user.email
          },
          profile: profile || null,
          profileError: profileError?.message || null
        })
      } catch (profileError) {
        return NextResponse.json({
          success: true,
          message: 'Login successful but profile lookup failed',
          user: {
            id: data.user.id,
            email: data.user.email
          },
          profileError: profileError instanceof Error ? profileError.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'No user data returned despite successful auth'
    })
    
  } catch (error) {
    console.error('[PROD-LOGIN-TEST] POST test failed:', error)
    return NextResponse.json({
      error: 'Login test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}