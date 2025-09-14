
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const optionType = searchParams.get('option_type')
    const includeInactive = searchParams.get('include_inactive') === 'true'
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Build query
    let query = supabase
      .from('work_option_settings')
      .select('*')
      .order('display_order', { ascending: true })
    
    // Filter by option type if provided
    if (optionType) {
      query = query.eq('option_type', optionType)
    }
    
    // Filter by active status unless explicitly including inactive
    if (!includeInactive) {
      // Check if user is system admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      // Only show inactive options to system admins and admins
      if (profile?.role !== 'system_admin' && profile?.role !== 'admin') {
        query = query.eq('is_active', true)
      }
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching work options:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/admin/work-options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is system admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'system_admin' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { option_type, option_value, option_label, display_order } = body
    
    // Validate required fields
    if (!option_type || !option_value || !option_label) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate option_type
    if (!['component_type', 'process_type'].includes(option_type)) {
      return NextResponse.json(
        { error: 'Invalid option_type' },
        { status: 400 }
      )
    }
    
    // Insert new option
    const { data, error } = await supabase
      .from('work_option_settings')
      .insert({
        option_type,
        option_value,
        option_label,
        display_order: display_order || 0,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating work option:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This option already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/work-options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is system admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'system_admin' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { id, option_label, display_order, is_active } = body
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }
    
    // Build update object
    const updateData: unknown = {}
    if (option_label !== undefined) updateData.option_label = option_label
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active
    
    // Update option
    const { data, error } = await supabase
      .from('work_option_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating work option:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/admin/work-options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is system admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'system_admin' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }
    
    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('work_option_settings')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error deleting work option:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Option deactivated successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/work-options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}