import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(
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
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const companyType = searchParams.get('company_type') || ''

    // Get all active partner companies with assignment status for this site
    let query = supabase
      .from('partner_companies')
      .select(`
        *,
        site_partners!left(site_id, partner_company_id)
      `)
      .eq('status', 'active')

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,representative_name.ilike.%${search}%,contact_person.ilike.%${search}%`)
    }

    if (companyType && companyType !== 'all') {
      query = query.eq('company_type', companyType)
    }

    const { data: partners, error } = await query.order('company_name')

    if (error) {
      console.error('Available partners query error:', error)
      return NextResponse.json({ error: 'Failed to fetch available partners' }, { status: 500 })
    }

    // Add is_assigned flag for each partner
    const partnersWithStatus = partners?.map((partner: unknown) => ({
      ...partner,
      is_assigned: partner.site_partners?.some((sp: unknown) => sp.site_id === siteId && sp.partner_company_id === partner.id) || false
    })) || []

    return NextResponse.json({
      success: true,
      data: partnersWithStatus
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
