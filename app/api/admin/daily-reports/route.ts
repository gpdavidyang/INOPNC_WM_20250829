
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

    // Fetch all daily reports with site and user information
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        sites(
          id,
          name,
          address
        ),
        submitted_by_profile:profiles!daily_reports_submitted_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Daily reports query error:', error)
      return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: reports || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}