
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const siteId = params.id
    const { partner_id, contract_status = 'active' } = await request.json()

    console.log('Assigning partner:', { siteId, partner_id, contract_status })

    if (!partner_id) {
      console.error('Missing partner_id')
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }

    // Check if partner is already assigned to this site
    const { data: existing } = await supabase
      .from('site_partners')
      .select('id')
      .eq('site_id', siteId)
      .eq('partner_company_id', partner_id)
      .single()

    if (existing) {
      console.error('Partner already assigned:', existing)
      return NextResponse.json({ error: 'Partner is already assigned to this site' }, { status: 400 })
    }

    // Assign partner to site
    const assignmentData = {
      site_id: siteId,
      partner_company_id: partner_id,
      contract_status,
      assigned_date: new Date().toISOString().split('T')[0] // Date only
    }
    console.log('Inserting assignment data:', assignmentData)

    const { error: assignError } = await supabase
      .from('site_partners')
      .insert(assignmentData)

    if (assignError) {
      console.error('Partner assignment error:', assignError)
      return NextResponse.json({ 
        error: 'Failed to assign partner', 
        details: assignError.message 
      }, { status: 500 })
    }

    console.log('Partner assigned successfully')

    return NextResponse.json({
      success: true,
      message: 'Partner assigned successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const siteId = params.id
    const { partner_id } = await request.json()

    if (!partner_id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }

    // Remove partner from site
    const { error: unassignError } = await supabase
      .from('site_partners')
      .delete()
      .eq('site_id', siteId)
      .eq('partner_company_id', partner_id)

    if (unassignError) {
      console.error('Partner unassignment error:', unassignError)
      return NextResponse.json({ error: 'Failed to unassign partner' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Partner unassigned successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}