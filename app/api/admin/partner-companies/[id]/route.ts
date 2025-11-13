import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_PARTNER_COMPANIES_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

const getClient = () => {
  try {
    return createServiceRoleClient()
  } catch {
    return createServerClient()
  }
}

const RELATION_CLEANUP = [
  { table: 'site_partners', column: 'partner_company_id', action: 'delete' },
  { table: 'material_suppliers', column: 'partner_company_id', action: 'delete' },
  { table: 'profiles', column: 'partner_company_id', action: 'set-null' },
  { table: 'daily_reports', column: 'partner_company_id', action: 'set-null' },
  { table: 'documents', column: 'partner_company_id', action: 'set-null' },
  { table: 'document_access_control', column: 'partner_company_id', action: 'delete' },
  { table: 'invoice_document_types', column: 'organization_id', action: 'set-null' },
  { table: 'unified_document_system', column: 'partner_company_id', action: 'set-null' },
]

async function cleanupPartnerRelations(
  supabase: ReturnType<typeof createServiceRoleClient> | ReturnType<typeof createServerClient>,
  partnerId: string
) {
  for (const rel of RELATION_CLEANUP) {
    try {
      if (rel.action === 'delete') {
        await (supabase as any).from(rel.table).delete().eq(rel.column, partnerId)
      } else if (rel.action === 'set-null') {
        const { error } = await (supabase as any)
          .from(rel.table)
          .update({ [rel.column]: null })
          .eq(rel.column, partnerId)
        if (error) {
          const message = String(error.message || error.code || '').toLowerCase()
          if (
            message.includes('violates') ||
            message.includes('not-null') ||
            message.includes('constraint')
          ) {
            await (supabase as any).from(rel.table).delete().eq(rel.column, partnerId)
            continue
          }
          if (message.includes('relation') || message.includes('column')) {
            console.warn(`[partner-companies][cleanup] skipped missing relation ${rel.table}`)
            continue
          }
          throw error
        }
      }
    } catch (error: any) {
      const code = error?.code || error?.message || ''
      // Ignore missing tables/columns in environments where these relations do not exist
      if (
        typeof code === 'string' &&
        (code.toLowerCase().includes('relation') || code.toLowerCase().includes('column'))
      ) {
        console.warn(`[partner-companies][cleanup] skipped missing relation ${rel.table}`)
        continue
      }
      console.error(`[partner-companies][cleanup] ${rel.table} error:`, error)
      throw error
    }
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult
  const { role } = authResult
  if (!role || !['admin', 'system_admin', 'site_manager', 'customer_manager'].includes(role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const supabase = getClient()
  try {
    const { data: partner, error } = await supabase
      .from('partner_companies')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!partner) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    return NextResponse.json({
      success: true,
      partner: {
        ...partner,
        contact_name: partner.contact_person || partner.representative_name || null,
        contact_phone: partner.phone || null,
        contact_email: partner.email || null,
      },
    })
  } catch (error) {
    console.error('[partner-companies][GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult
  const { role } = authResult
  if (!role || !['admin', 'system_admin'].includes(role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const supabase = getClient()
  let body: Record<string, unknown> = {}

  try {
    body = await request.json()
    const allowedFields = (({
      company_name,
      status,
      contact_name,
      contact_phone,
      contact_email,
      address,
    }) => ({
      ...(company_name !== undefined ? { company_name } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(contact_name !== undefined ? { contact_person: contact_name } : {}),
      ...(contact_phone !== undefined ? { phone: contact_phone } : {}),
      ...(contact_email !== undefined ? { email: contact_email } : {}),
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
      if (updateError) throw updateError
      updatedPartner = updateResult
    }

    const partner = updatedPartner ?? {
      ...(ADMIN_PARTNER_COMPANIES_STUB.find(item => item.id === params.id) ?? { id: params.id }),
      ...allowedFields,
    }

    return NextResponse.json({
      success: true,
      partner: {
        ...partner,
        contact_name:
          partner?.contact_person || partner?.representative_name || body.contact_name || null,
        contact_phone: partner?.phone || body.contact_phone || null,
        contact_email: partner?.email || body.contact_email || null,
      },
    })
  } catch (error) {
    console.error('[partner-companies][PATCH] error:', error)
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

  const supabase = getClient()
  try {
    await cleanupPartnerRelations(supabase, params.id)
    const { error } = await supabase.from('partner_companies').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[partner-companies][DELETE] error:', error)
    const message = (error as any)?.message
      ? `거래처를 삭제하지 못했습니다. (${(error as any).message})`
      : '거래처를 삭제하지 못했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
