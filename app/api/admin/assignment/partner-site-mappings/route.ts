import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: List all partner-site mappings
export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    // Get partner-site mappings with related data
    const { data: mappings, error } = await supabase
      .from('partner_site_mappings')
      .select(`
        id,
        partner_company_id,
        site_id,
        start_date,
        end_date,
        is_active,
        notes,
        created_at,
        updated_at,
        partner_company:partner_companies!partner_site_mappings_partner_company_id_fkey(
          id,
          company_name,
          business_number,
          representative_name
        ),
        site:sites!partner_site_mappings_site_id_fkey(
          id,
          name,
          address,
          status,
          manager_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch mappings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to load partner-site mappings' },
        { status: 500 }
      )
    }

    // Get assigned users count for each mapping
    const mappingsWithUserCounts = await Promise.all(
      (mappings || []).map(async (mapping: any) => {
        const { count } = await supabase
          .from('unified_user_assignments')
          .select('id', { count: 'exact' })
          .eq('site_id', mapping.site_id)
          .eq('is_active', true)
          .in('user_id', 
            supabase
              .from('profiles')
              .select('id')
              .eq('partner_company_id', mapping.partner_company_id)
          )

        return {
          ...mapping,
          assigned_users_count: count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: mappingsWithUserCounts
    })

  } catch (error) {
    console.error('Mappings fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load mappings data' },
      { status: 500 }
    )
  }
}

// POST: Create new partner-site mapping
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { partner_company_id, site_id, start_date, end_date, notes } = body

    // Validate required fields
    if (!partner_company_id || !site_id || !start_date) {
      return NextResponse.json(
        { success: false, error: 'Partner company, site, and start date are required' },
        { status: 400 }
      )
    }

    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from('partner_site_mappings')
      .select('id')
      .eq('partner_company_id', partner_company_id)
      .eq('site_id', site_id)
      .eq('is_active', true)
      .single()

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'This partner company is already mapped to this site' },
        { status: 409 }
      )
    }

    // Create new mapping
    const { data: newMapping, error } = await supabase
      .from('partner_site_mappings')
      .insert({
        partner_company_id,
        site_id,
        start_date,
        end_date: end_date || null,
        notes: notes || null,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create mapping:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create partner-site mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newMapping,
      message: 'Partner-site mapping created successfully'
    })

  } catch (error) {
    console.error('Mapping creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create mapping' },
      { status: 500 }
    )
  }
}