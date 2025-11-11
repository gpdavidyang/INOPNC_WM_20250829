import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_PARTNER_COMPANIES_STUB } from '@/lib/admin/stub-data'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

  // Prefer service-role; gracefully fall back to server client if env missing
  let supabase: ReturnType<typeof createServiceRoleClient> | ReturnType<typeof createServerClient>
  try {
    supabase = createServiceRoleClient()
  } catch {
    supabase = createServerClient()
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    let query = supabase
      .from('partner_companies')
      .select(
        'id, company_name, company_type, status, representative_name, contact_person, phone, email, address'
      )
      .order('company_name', { ascending: true })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (role === 'customer_manager' && restrictedOrgId) {
      query = query.eq('id', restrictedOrgId)
    }

    const { data, error } = await query
    if (error) throw error
    const normalized =
      data?.map(row => ({
        ...row,
        contact_name: row.contact_person || row.representative_name || null,
        contact_phone: row.phone || null,
        contact_email: row.email || null,
      })) || []

    return NextResponse.json({
      success: true,
      data: {
        partner_companies: normalized,
        total: normalized.length,
      },
    })
  } catch (e) {
    console.error('partner_companies handler error:', e)
    // Fallback to stub data to avoid hard failure in dev/missing envs
    const stubList = ADMIN_PARTNER_COMPANIES_STUB.filter(item => {
      const statusOk = !status || status === 'all' ? true : item.status === status
      const roleOk =
        role === 'customer_manager' && restrictedOrgId ? item.id === restrictedOrgId : true
      return statusOk && roleOk
    })
    return NextResponse.json({
      success: true,
      data: { partner_companies: stubList, total: stubList.length },
      source: 'stub',
    })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult
  const { role } = authResult
  if (!role || !['admin', 'system_admin'].includes(role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let supabase: ReturnType<typeof createServiceRoleClient> | ReturnType<typeof createServerClient>
  try {
    supabase = createServiceRoleClient()
  } catch {
    supabase = createServerClient()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const company_name = (body.company_name || '').trim()
    const company_type = (body.company_type || '').trim() || null
    const status = (body.status || 'active').trim()
    const contact_name = (body.contact_name || '').trim() || null
    const contact_phone = (body.contact_phone || '').trim() || null
    const contact_email = (body.contact_email || '').trim() || null
    const address = (body.address || '').trim() || null

    if (!company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('partner_companies')
      .insert({
        company_name,
        company_type,
        status,
        contact_person: contact_name,
        phone: contact_phone,
        email: contact_email,
        address,
      })
      .select(
        'id, company_name, company_type, status, representative_name, contact_person, phone, email, address'
      )
      .single()
    if (error) throw error
    return NextResponse.json({
      success: true,
      partner: {
        ...data,
        contact_name: data?.contact_person || data?.representative_name || null,
        contact_phone: data?.phone || null,
        contact_email: data?.email || null,
      },
    })
  } catch (e) {
    console.error('[partner-companies][POST] error:', e)
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
}
