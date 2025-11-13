import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ADMIN_PARTNER_COMPANIES_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

const allowedRoles = new Set([
  'admin',
  'system_admin',
  'site_manager',
  'customer_manager',
  'production_manager',
])

const SUPPLIER_COLUMNS =
  'id, name, contact_person, phone, email, address, business_number, is_active, created_at, updated_at'

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

const supplierStub = ADMIN_PARTNER_COMPANIES_STUB.filter(
  item => (item.company_type || '').toLowerCase() === 'supplier'
).map(item =>
  mapSupplier({
    id: item.id,
    name: item.company_name,
    contact_person: item.contact_person ?? item.representative_name,
    phone: item.contact_phone ?? item.phone,
    email: item.contact_email ?? item.email,
    address: item.address,
    business_number: item.business_number,
    is_active: item.status !== 'inactive',
  })
)

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) return authResult

  const { role } = authResult
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const supabase = getClient()
  const { searchParams } = new URL(request.url)
  const statusFilter = (searchParams.get('status') || 'all').toLowerCase()

  try {
    let query = supabase.from('material_suppliers').select(SUPPLIER_COLUMNS).order('name', {
      ascending: true,
    })

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data, error } = await query
    if (error) throw error

    const list = (data || []).map(mapSupplier)

    return NextResponse.json({
      success: true,
      data: {
        material_suppliers: list,
        total: list.length,
      },
    })
  } catch (error) {
    console.error('[material-suppliers][GET] error:', error)
    const filteredStub =
      statusFilter === 'all'
        ? supplierStub
        : supplierStub.filter(item =>
            statusFilter === 'active' ? item.status === 'active' : item.status === 'inactive'
          )
    return NextResponse.json({
      success: true,
      data: {
        material_suppliers: filteredStub,
        total: filteredStub.length,
      },
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

  const supabase = getClient()
  let body: Record<string, any> = {}
  let company_name = ''
  let status = 'active'

  try {
    body = await request.json().catch(() => ({}))
    company_name = ((body.name ?? body.company_name) || '').trim()
    if (!company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
    }

    status = String(body.status ?? 'active')
      .trim()
      .toLowerCase()
    const supplierPayload = {
      name: company_name,
      contact_person: (body.contact_name || '').trim() || null,
      phone: (body.contact_phone || '').trim() || null,
      email: (body.contact_email || '').trim() || null,
      address: (body.address || '').trim() || null,
      business_number: (body.business_number || '').trim() || null,
      is_active: status !== 'inactive',
    }

    const { data, error } = await supabase
      .from('material_suppliers')
      .insert(supplierPayload)
      .select(SUPPLIER_COLUMNS)
      .single()
    if (error) throw error

    return NextResponse.json({
      success: true,
      supplier: mapSupplier(data),
    })
  } catch (error) {
    console.error('[material-suppliers][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
