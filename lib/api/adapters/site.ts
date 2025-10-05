import { createClient } from '@/lib/supabase/server'
import type { ListSitesRequest, ListSitesResponse } from '../contracts/site'

export async function listSites(req: ListSitesRequest): Promise<ListSitesResponse> {
  const supabase = createClient()

  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('sites')
    .select(
      'id, name, address, status, start_date, end_date, manager_name, manager_phone, created_at',
      { count: 'exact' }
    )
    .order(req.sort || 'created_at', { ascending: (req.direction || 'desc') === 'asc' })
    .range(from, to)

  // Soft-delete filters
  if (req.onlyDeleted) {
    query = query.eq('is_deleted', true)
  } else if (!req.includeDeleted) {
    // Exclude by default unless includeDeleted explicitly set
    query = query.eq('is_deleted', false)
  }

  if (req.q) {
    const q = req.q.trim()
    if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`)
  }
  if (req.status && req.status !== 'all') {
    query = query.eq('status', req.status)
  }

  const { data, error, count } = await query
  if (error) {
    return { items: [], total: 0 }
  }

  const items = (data || []).map((s: any) => ({
    id: String(s.id),
    name: s.name,
    address: s.address ?? null,
    status: s.status ?? null,
    start_date: s.start_date ?? null,
    end_date: s.end_date ?? null,
    manager_name: s.manager_name ?? null,
    manager_phone: s.manager_phone ?? s.construction_manager_phone ?? null,
    created_at: s.created_at ?? null,
  }))

  return { items, total: count ?? items.length }
}
