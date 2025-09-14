
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let query = supabase
      .from('partner_companies')
      .select('id, company_name, company_type, status')
      .eq('status', 'active')
      .order('company_name')

    // Role-based filtering
    if (profile.role === 'customer_manager') {
      // Customer manager only sees their own company
      if (!profile.partner_company_id) {
        return NextResponse.json({ error: 'No partner company assigned' }, { status: 403 })
      }
      query = query.eq('id', profile.partner_company_id)
    } else if (!['admin', 'system_admin', 'site_manager', 'worker'].includes(profile.role)) {
      // Other roles don't have access
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
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