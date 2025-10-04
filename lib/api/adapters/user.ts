import { createClient } from '@/lib/supabase/server'
import type { ListUsersRequest, ListUsersResponse } from '../contracts/user'

// Adapter encapsulates Supabase details and returns contract-shaped data
export async function listUsers(req: ListUsersRequest): Promise<ListUsersResponse> {
  const supabase = createClient()

  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (req.q) {
    // Basic text filter assuming full_name/email are text columns
    query = query.ilike('full_name', `%${req.q}%`)
  }

  const { data, error, count } = await query
  if (error) {
    // Return empty list on error; upper layers can show error toast
    return { items: [], total: 0 }
  }

  const items = (data || []).map(row => ({
    id: String(row.id),
    name: (row as any).full_name ?? '',
    email: (row as any).email ?? '',
    role: (row as any).role ?? undefined,
    createdAt: (row as any).created_at ?? undefined,
  }))

  return {
    items,
    total: count ?? items.length,
  }
}
