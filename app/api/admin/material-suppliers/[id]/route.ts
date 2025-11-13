import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SUPPLIER_COLUMNS =
  'id, name, contact_person, phone, email, address, business_number, is_active, created_at, updated_at'

const allowedReadRoles = new Set([
  'admin',
  'system_admin',
  'site_manager',
  'customer_manager',
  'production_manager',
])

const getClient = () => {
  try {
    return createServiceRoleClient()
  } catch {
    return createServerClient()
  }
}

const mapSupplier = (row: any) => ({
  id: row?.id,
  company_name: row?.name ?? '',
  status: row?.is_active === false ? 'inactive' : 'active',
  contact_name: row?.contact_person ?? null,
  contact_phone: row?.phone ?? null,
  contact_email: row?.email ?? null,
  address: row?.address ?? null,
  business_number: row?.business_number ?? null,
  is_active: row?.is_active ?? true,
  created_at: row?.created_at ?? null,
  updated_at: row?.updated_at ?? null,
})

const SUPPLIER_RELATION_CLEANUP = [
  { table: 'materials', column: 'supplier_id' },
  { table: 'material_request_items', column: 'supplier_id' },
  { table: 'material_transactions', column: 'supplier_id' },
]

async function cleanupSupplierRelations(
  supabase: ReturnType<typeof createServiceRoleClient> | ReturnType<typeof createServerClient>,
  supplierId: string
) {
  for (const rel of SUPPLIER_RELATION_CLEANUP) {
    try {
      const { error } = await (supabase as any)
        .from(rel.table)
        .update({ [rel.column]: null })
        .eq(rel.column, supplierId)
      if (error) {
        const message = String(error.message || error.code || '').toLowerCase()
        if (message.includes('not-null') || message.includes('constraint')) {
          // As a last resort remove dependent rows to satisfy FK constraints.
          await (supabase as any).from(rel.table).delete().eq(rel.column, supplierId)
          continue
        }
        if (message.includes('relation') || message.includes('column')) {
          console.warn(`[material-suppliers][cleanup] missing relation ${rel.table}`)
          continue
        }
        throw error
      }
    } catch (error: any) {
      const code = String(error?.code || error?.message || '').toLowerCase()
      if (code.includes('relation') || code.includes('column')) {
        console.warn(`[material-suppliers][cleanup] skipped relation ${rel.table}`)
        continue
      }
      console.error(`[material-suppliers][cleanup] ${rel.table} error:`, error)
      throw error
    }
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult
  const { role } = authResult
  if (!role || !allowedReadRoles.has(role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const supabase = getClient()
  try {
    const { data, error } = await supabase
      .from('material_suppliers')
      .select(SUPPLIER_COLUMNS)
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    return NextResponse.json({
      success: true,
      supplier: mapSupplier(data),
    })
  } catch (error) {
    console.error('[material-suppliers][GET] error:', error)
    return NextResponse.json({ error: 'Failed to load supplier' }, { status: 500 })
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
  try {
    const body = await request.json().catch(() => ({}))
    const updates: Record<string, any> = {}

    if (body.name !== undefined || body.company_name !== undefined) {
      const name = ((body.name ?? body.company_name) || '').trim()
      if (name) updates.name = name
    }
    if (body.status !== undefined) {
      updates.is_active = String(body.status).toLowerCase() !== 'inactive'
    }
    if (body.contact_name !== undefined) updates.contact_person = body.contact_name?.trim() || null
    if (body.contact_phone !== undefined) updates.phone = body.contact_phone?.trim() || null
    if (body.contact_email !== undefined) updates.email = body.contact_email?.trim() || null
    if (body.address !== undefined) updates.address = body.address?.trim() || null
    if (body.business_number !== undefined)
      updates.business_number = body.business_number?.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, supplier: mapSupplier({ id: params.id }) })
    }

    const { data, error } = await supabase
      .from('material_suppliers')
      .update(updates)
      .eq('id', params.id)
      .select(SUPPLIER_COLUMNS)
      .maybeSingle()
    if (error) throw error

    return NextResponse.json({
      success: true,
      supplier: mapSupplier(data),
    })
  } catch (error) {
    console.error('[material-suppliers][PATCH] error:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
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
    await cleanupSupplierRelations(supabase, params.id)
    const { error } = await supabase.from('material_suppliers').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[material-suppliers][DELETE] error:', error)
    const message =
      error?.message && typeof error.message === 'string'
        ? `거래처를 삭제하지 못했습니다. (${error.message})`
        : '거래처를 삭제하지 못했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
