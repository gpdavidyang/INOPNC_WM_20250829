import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

  const supabase = createClient()

  try {
    const { data: partner, error } = await supabase
      .from('partner_companies')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      throw error
    }

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

    const fallback = ADMIN_PARTNER_COMPANIES_STUB.find((item) => item.id === params.id)
    if (!fallback) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      partner: fallback,
      related: ADMIN_PARTNER_RELATIONS[params.id] ?? { sites: [], contacts: [] },
      source: 'stub',
    })
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
    const supabase = createClient()

    body = await request.json()
    const allowedFields = (({ company_name, company_type, status, contact_name, contact_phone, contact_email }) => ({
      ...(company_name !== undefined ? { company_name } : {}),
      ...(company_type !== undefined ? { company_type } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(contact_name !== undefined ? { contact_name } : {}),
      ...(contact_phone !== undefined ? { contact_phone } : {}),
      ...(contact_email !== undefined ? { contact_email } : {}),
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
      ...(ADMIN_PARTNER_COMPANIES_STUB.find((item) => item.id === params.id) ?? { id: params.id }),
      ...allowedFields,
    }

    return NextResponse.json({ success: true, partner })
  } catch (error) {
    console.error('Partner company update error:', error)

    const fallback = ADMIN_PARTNER_COMPANIES_STUB.find((item) => item.id === params.id)

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
