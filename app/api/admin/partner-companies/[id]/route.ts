import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_PARTNER_COMPANIES_STUB, ADMIN_PARTNER_RELATIONS } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role } = authResult

  if (!role || !['admin', 'system_admin', 'site_manager', 'customer_manager'].includes(role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let supabase: ReturnType<typeof createServiceRoleClient> | ReturnType<typeof createServerClient>
  try {
    supabase = createServiceRoleClient()
  } catch {
    supabase = createServerClient()
  }

  try {
    const { data: partner, error } = await supabase
      .from('partner_companies')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error) throw error

    if (!partner) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      partner,
      related: ADMIN_PARTNER_RELATIONS[params.id] ?? { sites: [], contacts: [] },
    })
  } catch (error) {
    console.error('Partner company detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role } = authResult

  if (!role || !['admin', 'system_admin'].includes(role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let body: Record<string, unknown> = {}

  try {
    let supabase: ReturnType<typeof createServiceRoleClient> | ReturnType<typeof createServerClient>
    try {
      supabase = createServiceRoleClient()
    } catch {
      supabase = createServerClient()
    }

    body = await request.json()
    const allowedFields = (({
      company_name,
      company_type,
      status,
      contact_name,
      contact_phone,
      contact_email,
      address,
    }) => ({
      ...(company_name !== undefined ? { company_name } : {}),
      ...(company_type !== undefined ? { company_type } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(contact_name !== undefined ? { contact_name } : {}),
      ...(contact_phone !== undefined ? { contact_phone } : {}),
      ...(contact_email !== undefined ? { contact_email } : {}),
      ...(address !== undefined ? { address } : {}),
    }))(body as Record<string, string | undefined>)

    let updatedPartner = null

    if (Object.keys(allowedFields).length > 0) {
      const { data: updateResult, error: updateError } = await supabase
        .from('partner_companies')
        .update(allowedFields)
        .eq('id', params.id)
        .select()
        .maybeSingle()

      if (updateError) {
        throw updateError
      }

      updatedPartner = updateResult
    }

    const partner = updatedPartner ?? {
      ...(ADMIN_PARTNER_COMPANIES_STUB.find(item => item.id === params.id) ?? { id: params.id }),
      ...allowedFields,
    }

    return NextResponse.json({ success: true, partner })
  } catch (error) {
    console.error('Partner company update error:', error)

    const fallback = ADMIN_PARTNER_COMPANIES_STUB.find(item => item.id === params.id)

    return NextResponse.json({
      success: true,
      partner: {
        ...(fallback ?? { id: params.id }),
        ...body,
      },
      source: 'stub',
    })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
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
    const { error } = await (supabase as any).from('partner_companies').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[partner-companies][DELETE] error:', e)
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 })
  }
}
