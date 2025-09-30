import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role, restrictedOrgId } = authResult

  if (!role || !['admin', 'system_admin', 'site_manager', 'customer_manager'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    let query = supabase
      .from('partner_companies')
      .select('id, company_name, company_type, status, contact_name, contact_phone')
      .order('company_name', { ascending: true })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (role === 'customer_manager' && restrictedOrgId) {
      query = query.eq('id', restrictedOrgId)
    }

    const { data, error } = await query
    if (error) {
      console.error('partner_companies fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to load partner companies' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        partner_companies: data || [],
        total: data?.length || 0,
      },
    })
  } catch (e) {
    console.error('partner_companies handler error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
