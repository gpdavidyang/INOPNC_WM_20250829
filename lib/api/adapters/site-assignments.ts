import { createClient } from '@/lib/supabase/server'
import type {
  ListSiteAssignmentsResponse,
  SiteLaborSummaryResponse,
} from '../contracts/site-assignments'

export async function listSiteAssignments(
  siteId: string,
  includeInactive: boolean = false,
  opts?: {
    search?: string
    role?: string
    company?: string
    sort?: 'name' | 'role' | 'company' | 'date'
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }
): Promise<ListSiteAssignmentsResponse> {
  const supabase = createClient()

  let base = supabase.from('site_assignments').select('*').eq('site_id', siteId)

  const { data: assigns, error } = await (includeInactive ? base : base.eq('is_active', true))

  if (error) return { rows: [], total: 0 }

  let assignments = assigns || []
  if (assignments.length === 0) return { rows: [], total: 0 }

  const userIds = Array.from(new Set(assignments.map((a: any) => a.user_id).filter(Boolean)))

  let profiles: any[] = []
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, organization_id')
      .in('id', userIds)
    profiles = profs || []
  }

  // Organizations lookup
  const orgIds = Array.from(new Set(profiles.map(p => (p as any).organization_id).filter(Boolean)))
  const organizations: Record<string, { id: string; name?: string | null }> = {}
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds)
    for (const o of orgs || [])
      organizations[(o as any).id] = { id: (o as any).id, name: (o as any).name }
  }

  const profMap = new Map<string, any>()
  for (const p of profiles) profMap.set((p as any).id, p)

  // Build rows with profile/org
  let rows = assignments.map(a => {
    const p = profMap.get((a as any).user_id)
    const orgId = p?.organization_id || null
    const org = orgId ? organizations[orgId] : undefined
    return {
      site_id: (a as any).site_id,
      user_id: (a as any).user_id,
      role: (a as any).role,
      assigned_at: (a as any).assigned_date ?? (a as any).assigned_at ?? null,
      assigned_date: (a as any).assigned_date ?? null,
      is_active: (a as any).is_active ?? true,
      profile: p
        ? {
            id: p.id,
            full_name: p.full_name ?? null,
            email: p.email ?? null,
            phone: p.phone ?? null,
            role: p.role ?? null,
            organization: org ?? null,
          }
        : null,
    }
  })

  // Filtering (search, role)
  const search = (opts?.search || '').trim().toLowerCase()
  if (search) {
    rows = rows.filter(r => {
      const fields = [
        r.profile?.full_name ?? '',
        r.profile?.email ?? '',
        r.profile?.organization?.name ?? '',
        r.role ?? '',
      ].map(v => String(v).toLowerCase())
      return fields.some(v => v.includes(search))
    })
  }
  if (opts?.role && opts.role !== 'all') {
    rows = rows.filter(r => String(r.role || '').toLowerCase() === String(opts.role).toLowerCase())
  }
  if (opts?.company && String(opts.company).trim()) {
    const comp = String(opts.company).trim().toLowerCase()
    rows = rows.filter(r => String(r.profile?.organization?.name || '').toLowerCase() === comp)
  }

  const total = rows.length

  // Sorting
  const sortKey = opts?.sort || 'date'
  const order: 'asc' | 'desc' = opts?.order || 'desc'
  rows.sort((a, b) => {
    const nameA = String(a.profile?.full_name || '').toLowerCase()
    const nameB = String(b.profile?.full_name || '').toLowerCase()
    const roleA = String(a.role || '').toLowerCase()
    const roleB = String(b.role || '').toLowerCase()
    const compA = String(a.profile?.organization?.name || '').toLowerCase()
    const compB = String(b.profile?.organization?.name || '').toLowerCase()
    const dateA = a.assigned_date ? new Date(a.assigned_date).getTime() : 0
    const dateB = b.assigned_date ? new Date(b.assigned_date).getTime() : 0
    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = nameA.localeCompare(nameB)
        break
      case 'role':
        cmp = roleA.localeCompare(roleB) || nameA.localeCompare(nameB)
        break
      case 'company':
        cmp = compA.localeCompare(compB) || nameA.localeCompare(nameB)
        break
      case 'date':
      default:
        cmp = dateA - dateB
    }
    return order === 'asc' ? cmp : -cmp
  })

  // Pagination
  const start = Math.max(0, opts?.offset || 0)
  const end = Math.max(0, opts?.limit || rows.length)
  const paged = rows.slice(start, start + end)
  return { rows: paged, total }
}

export async function getSiteLaborSummary(
  siteId: string,
  userIds?: string[]
): Promise<SiteLaborSummaryResponse> {
  const supabase = createClient()
  let query = supabase
    .from('work_records')
    .select('user_id, labor_hours, work_hours')
    .eq('site_id', siteId)
  if (userIds && userIds.length > 0) {
    query = query.in('user_id', userIds)
  }
  const { data, error } = await query
  if (error) return {}
  const map: Record<string, number> = {}
  for (const r of data || []) {
    const key = (r as any).user_id
    if (!key) continue
    const labor = Number((r as any).labor_hours) || 0
    const hours = Number((r as any).work_hours) || 0
    const manDays = labor > 0 ? labor : hours > 0 ? hours / 8 : 0
    map[key] = (map[key] || 0) + manDays
  }
  return map
}

/**
 * Aggregate labor across ALL sites per user.
 * Returns man-days (공수) per user_id.
 */
export async function getGlobalLaborSummary(userIds?: string[]): Promise<Record<string, number>> {
  const supabase = createClient()
  let query = supabase.from('work_records').select('user_id, labor_hours, work_hours')
  if (userIds && userIds.length > 0) {
    query = query.in('user_id', userIds)
  }
  const { data, error } = await query
  if (error) return {}
  const map: Record<string, number> = {}
  for (const r of data || []) {
    const uid = (r as any).user_id
    if (!uid) continue
    const labor = Number((r as any).labor_hours) || 0 // already man-days
    const hours = Number((r as any).work_hours) || 0 // hours
    const manDays = labor > 0 ? labor : hours > 0 ? hours / 8 : 0
    map[uid] = (map[uid] || 0) + manDays
  }
  return map
}
