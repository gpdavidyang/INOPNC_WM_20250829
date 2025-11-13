import { createClient } from '@/lib/supabase/server'

type SupplierRow = {
  id: string
  company_name?: string | null
  status?: string | null
  contact_name?: string | null
  contact_phone?: string | null
}

type SupplierApiResponse = {
  data?: { material_suppliers?: SupplierRow[] }
}

const STATUS_QUERY = {
  active: 'active',
  inactive: 'inactive',
  all: 'all',
} as const

const API_PATH = '/api/admin/material-suppliers'

export async function loadMaterialPartnerRows(
  status: keyof typeof STATUS_QUERY = 'active'
): Promise<SupplierRow[]> {
  const shouldUseApi =
    typeof window !== 'undefined' &&
    Boolean(process.env.NEXT_PUBLIC_SITE_URL) &&
    process.env.NEXT_RUNTIME !== 'edge'

  if (shouldUseApi) {
    const queryString = status === 'all' ? '' : `?status=${STATUS_QUERY[status]}`
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
    const apiUrl = `${baseUrl}${API_PATH}${queryString}`

    try {
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'include',
      })
      if (res.ok) {
        const json = (await res.json()) as SupplierApiResponse
        if (Array.isArray(json?.data?.material_suppliers)) {
          return json.data.material_suppliers
        }
      } else {
        console.warn('[loadMaterialPartnerRows] API error:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('[loadMaterialPartnerRows] API fetch failed', error)
    }
  }

  const supabase = createClient()
  let query = supabase
    .from('material_suppliers')
    .select('id, name, is_active, contact_person, phone')
    .order('name', { ascending: true })

  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data, error } = await query
  if (error) {
    console.error('[loadMaterialPartnerRows] supabase fallback error', error)
    return []
  }

  return (
    data?.map(row => ({
      id: row.id,
      company_name: row.name,
      status: row.is_active === false ? 'inactive' : 'active',
      contact_name: row.contact_person ?? null,
      contact_phone: row.phone ?? null,
    })) ?? []
  )
}
