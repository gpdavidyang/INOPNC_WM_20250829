import { createClient } from '@/lib/supabase/server'
import type {
  ListSiteAssignmentsResponse,
  SiteLaborSummaryResponse,
} from '../contracts/site-assignments'

export async function listSiteAssignments(
  siteId: string,
  includeInactive: boolean = false
): Promise<ListSiteAssignmentsResponse> {
  const supabase = createClient()

  let base = supabase.from('site_assignments').select('*').eq('site_id', siteId)

  const { data: assigns, error } = await (includeInactive ? base : base.eq('is_active', true))

  if (error) return []

  const assignments = assigns || []
  if (assignments.length === 0) return []

  const userIds = Array.from(new Set(assignments.map((a: any) => a.user_id).filter(Boolean)))

  let profiles: any[] = []
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, organization_id')
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

  return assignments.map(a => {
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
            role: p.role ?? null,
            organization: org ?? null,
          }
        : null,
    }
  })
}

export async function getSiteLaborSummary(
  siteId: string,
  userIds?: string[]
): Promise<SiteLaborSummaryResponse> {
  const supabase = createClient()
  let query = supabase.from('work_records').select('user_id, labor_hours').eq('site_id', siteId)
  if (userIds && userIds.length > 0) {
    query = query.in('user_id', userIds)
  }
  const { data, error } = await query
  if (error) return {}
  const map: Record<string, number> = {}
  for (const r of data || []) {
    const key = (r as any).user_id
    if (!key) continue
    const v = Number((r as any).labor_hours) || 0
    map[key] = (map[key] || 0) + v
  }
  return map
}
