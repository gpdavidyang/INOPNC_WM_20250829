
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch all users with their associated data
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        *,
        sites(
          id,
          name,
          address
        )
      `)
      .order('full_name')

    if (error) {
      console.error('Users query error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: users || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}