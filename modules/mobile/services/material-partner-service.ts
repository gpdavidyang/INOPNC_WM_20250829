import { createClient } from '@/lib/supabase/server'

type PartnerRow = {
  id: string
  company_name?: string | null
  status?: string | null
  company_type?: string | null
}

type PartnerApiResponse = {
  data?: { partner_companies?: PartnerRow[] }
}

const STATUS_QUERY = {
  active: 'active',
  all: 'all',
} as const

export async function loadMaterialPartnerRows(
  status: keyof typeof STATUS_QUERY = 'active'
): Promise<PartnerRow[]> {
  const queryString = status === 'all' ? '' : `?status=${STATUS_QUERY[status]}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const apiUrl = `${baseUrl}/api/admin/partner-companies${queryString}`

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      credentials: 'include',
    })
    if (res.ok) {
      const json = (await res.json()) as PartnerApiResponse
      if (Array.isArray(json?.data?.partner_companies)) {
        return json.data.partner_companies
      }
    } else {
      console.warn('[loadMaterialPartnerRows] API error:', res.status, res.statusText)
    }
  } catch (error) {
    console.error('[loadMaterialPartnerRows] API fetch failed', error)
  }

  const supabase = createClient()
  let query = supabase
    .from('partner_companies')
    .select('id, company_name, status, company_type')
    .order('company_name', { ascending: true })

  if (status === 'active') {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query
  if (error) {
    console.error('[loadMaterialPartnerRows] supabase fallback error', error)
    return []
  }
  return data || []
}
