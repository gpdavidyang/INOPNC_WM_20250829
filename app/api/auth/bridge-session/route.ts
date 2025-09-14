
export async function POST(request: NextRequest) {
  try {
    console.log('[BRIDGE-SESSION API] Starting session bridge...')
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Don't set cookies in bridge endpoint - just read them
          },
        },
      }
    )

    // Get session from server-side cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('[BRIDGE-SESSION API] Session error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    if (!session) {
      console.log('[BRIDGE-SESSION API] No session found in server cookies')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    console.log('[BRIDGE-SESSION API] Session bridged for user:', session.user?.email)
    
    // Return session data for client to use
    return NextResponse.json({ 
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        user: session.user
      }
    })
    
  } catch (error) {
    console.error('[BRIDGE-SESSION API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to bridge session' }, 
      { status: 500 }
    )
  }
}