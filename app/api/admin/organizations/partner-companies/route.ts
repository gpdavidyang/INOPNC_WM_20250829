
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const allowedRoles = ['admin', 'system_admin', 'site_manager', 'worker', 'customer_manager']
    if (!allowedRoles.includes(authResult.role ?? '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = createClient()

    let query = supabase
      .from('partner_companies')
      .select('id, company_name, company_type, status')
      .eq('status', 'active')
      .order('company_name')

    // Role-based filtering
    if (authResult.role === 'customer_manager') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_company_id')
        .eq('id', authResult.userId)
        .single()

      if (!profile || !profile.partner_company_id) {
        return NextResponse.json({ error: 'No partner company assigned' }, { status: 403 })
      }

      // Customer manager only sees their own company
      query = query.eq('id', profile.partner_company_id)
    }
    // admin, system_admin, site_manager, worker can see all partner companies

    const { data: partnerCompanies, error } = await query

    if (error) {
      console.error('Error fetching partner companies:', error)
      return NextResponse.json({ error: 'Failed to fetch partner companies' }, { status: 500 })
    }

    return NextResponse.json(partnerCompanies || [])
  } catch (error) {
    console.error('Error in partner companies API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
