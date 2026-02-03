import { normalizeLaborUnit } from '@/lib/labor/labor-hour-options'
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
    const targetRole = String(opts.role).toLowerCase()
    rows = rows.filter(r => {
      const displayRole = (r.profile?.role || r.role || '').toLowerCase()
      return displayRole === targetRole
    })
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
  let supabase
  try {
    supabase = createClient()
  } catch (error) {
    // Fallback: This handles cases like running in a script where `cookies()` is not available
    const { createServiceRoleClient } = require('@/lib/supabase/service-role')
    supabase = createServiceRoleClient()
  }

  // 1. Fetch Daily Report Workers (Primary Source now - from JSON/Table in Approved Reports)
  // Site Labor Summary includes ONLY 'approved' reports per user request
  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, work_date, work_content, status')
    .eq('site_id', siteId)
    .eq('status', 'approved')

  const reportIds = (reports || []).map(r => r.id)

  const { data: reportWorkers } =
    reportIds.length > 0
      ? await supabase
          .from('daily_report_workers')
          .select('worker_id, work_hours, daily_report_id')
          .in('daily_report_id', reportIds)
          .not('worker_id', 'is', null)
      : { data: [] }

  const map: Record<string, number> = {}

  // B. Process Secondary (Report Workers - Table)
  const reportDateMap = new Map<string, string>() // reportId -> date
  const reportContentMap = new Map<string, any>() // reportId -> work_content (JSON)

  reports?.forEach(r => {
    reportDateMap.set(r.id, r.work_date)
    reportContentMap.set(r.id, r.work_content)
  })

  // Set of (userId, date) handled by Table to avoid counting JSON again for same day
  const tableHandled = new Set<string>()

  for (const rw of (reportWorkers as any[]) || []) {
    const uid = rw.worker_id
    if (!uid) continue
    if (userIds && userIds.length > 0 && !userIds.includes(uid)) continue

    const date = reportDateMap.get(rw.daily_report_id)

    const hours = Number(rw.work_hours) || 0
    const manDays = normalizeLaborUnit(hours > 0 ? hours : 1.0)
    map[uid] = (map[uid] || 0) + manDays

    if (date) tableHandled.add(`${uid}_${date}`)
  }

  // C. Process Tertiary (Report Content - JSON)
  // This is needed because sometimes daily_report_workers table is empty but JSON has data.
  // We iterate through ALL reports for the site.
  for (const r of reports || []) {
    const date = r.work_date
    let content: any = r.work_content

    if (!content) continue
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch {
        continue
      }
    }

    // Check for workers array
    const workers = Array.isArray(content?.workers)
      ? content.workers
      : Array.isArray(content?.worker_entries)
        ? content.worker_entries
        : []

    for (const w of workers) {
      // Identify User
      const wUid = w.workerId || w.worker_id || w.id || w.userId
      if (!wUid) continue

      // Filter if specific users requested
      if (userIds && userIds.length > 0 && !userIds.includes(wUid)) continue

      // Skip if already handled by Table
      if (date && tableHandled.has(`${wUid}_${date}`)) continue

      // Calculate Labor
      let manDays = 0
      if (w.labor_hours !== undefined) {
        manDays = normalizeLaborUnit(Number(w.labor_hours))
      } else {
        const h = Number(w.hours ?? w.work_hours ?? 0)
        manDays = normalizeLaborUnit(h > 0 ? h : 1.0)
      }

      if (manDays > 0) {
        map[wUid] = (map[wUid] || 0) + manDays
        // Mark as handled to prevent duplicate counting if multiple entries per day (rare but possible)
        if (date) tableHandled.add(`${wUid}_${date}`)
      }
    }
  }

  return map
}

/**
 * Aggregate labor across ALL sites per user.
 * Returns man-days (공수) per user_id.
 */
export async function getGlobalLaborSummary(userIds?: string[]): Promise<Record<string, number>> {
  const supabase = createClient()

  // 1. Fetch Daily Reports where these users might be present
  // Global Labor Summary ONLY includes 'approved' reports per user request
  let reportIds: string[] = []
  if (userIds && userIds.length > 0) {
    const { data: rwData } = await supabase
      .from('daily_report_workers')
      .select('daily_report_id')
      .in('worker_id', userIds)
    reportIds = Array.from(new Set((rwData || []).map(r => r.daily_report_id)))
  } else {
    const { data: rAll } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('status', 'approved')
    reportIds = (rAll || []).map(r => r.id)
  }

  const { data: reports } =
    reportIds.length > 0
      ? await supabase
          .from('daily_reports')
          .select('id, work_date, work_content, status')
          .in('id', reportIds)
          .eq('status', 'approved')
      : { data: [] }

  let reportWorkers: any[] = []
  if (reportIds.length > 0) {
    let rwQuery = supabase
      .from('daily_report_workers')
      .select('worker_id, work_hours, daily_report_id')
      .in('daily_report_id', reportIds)
      .not('worker_id', 'is', null)
    if (userIds && userIds.length > 0) {
      rwQuery = rwQuery.in('worker_id', userIds)
    }
    const { data } = await rwQuery
    reportWorkers = data || []
  }

  const map: Record<string, number> = {}

  // B. Report Workers Table
  const reportDateMap = new Map<string, string>()
  reports?.forEach(r => reportDateMap.set(r.id, r.work_date))
  const tableHandled = new Set<string>()

  for (const rw of reportWorkers) {
    const uid = rw.worker_id
    const date = reportDateMap.get(rw.daily_report_id)

    const hours = Number(rw.work_hours) || 0
    const manDays = normalizeLaborUnit(hours > 0 ? hours : 1.0)
    map[uid] = (map[uid] || 0) + manDays
    if (date) tableHandled.add(`${uid}_${date}`)
  }

  // C. Report JSON Content
  for (const r of reports || []) {
    const date = r.work_date
    let content: any = r.work_content
    if (!content) continue
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch {
        continue
      }
    }

    const workers = Array.isArray(content?.workers)
      ? content.workers
      : Array.isArray(content?.worker_entries)
        ? content.worker_entries
        : []
    for (const w of workers) {
      const wUid = w.workerId || w.worker_id || w.id || w.userId
      if (!wUid) continue
      if (userIds && userIds.length > 0 && !userIds.includes(wUid)) continue
      if (date && tableHandled.has(`${wUid}_${date}`)) continue

      let manDays = 0
      if (w.labor_hours !== undefined) {
        manDays = normalizeLaborUnit(Number(w.labor_hours))
      } else {
        const h = Number(w.hours ?? w.work_hours ?? 0)
        manDays = normalizeLaborUnit(h > 0 ? h : 1.0)
      }

      if (manDays > 0) {
        map[wUid] = (map[wUid] || 0) + manDays
        if (date) tableHandled.add(`${wUid}_${date}`)
      }
    }
  }

  return map
}
