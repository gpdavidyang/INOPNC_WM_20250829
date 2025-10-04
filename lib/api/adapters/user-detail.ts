import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserDetail } from '../contracts/user-detail'

export async function getUserDetail(
  userId: string,
  includeInactive: boolean = false
): Promise<UserDetail | null> {
  const supabase = createClient()

  // Base profile
  const { data: base } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, phone, organization_id, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (!base) return null

  let organization: { id: string; name: string | null } | null = null
  if ((base as any).organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', (base as any).organization_id)
      .maybeSingle()
    if (org) organization = { id: String(org.id), name: (org as any).name || null }
  }

  // Assignments
  let assignQuery = supabase
    .from('site_assignments')
    .select('site_id, role, assigned_date, is_active, sites!inner(name)')
    .eq('user_id', userId)
  if (!includeInactive) assignQuery = assignQuery.eq('is_active', true)
  const { data: assignments } = await assignQuery
  const site_assignments = (assignments || []).map((a: any) => ({
    site_id: a.site_id,
    site_name: a.sites?.name || '',
    role: a.role || (base as any).role,
    assigned_at: a.assigned_date,
    is_active: a.is_active,
  }))

  // Required documents
  const REQUIRED_DOCUMENT_TYPES = [
    'medical_checkup',
    'safety_education',
    'vehicle_insurance',
    'vehicle_registration',
    'payroll_stub',
    'id_card',
    'senior_documents',
  ]
  const { data: userDocs } = await supabase
    .from('user_documents')
    .select('document_type, upload_date, file_path')
    .eq('user_id', userId)
  // Default validity policy (months)
  const validityMonths: Record<string, number> = {
    medical_checkup: 12,
    safety_education: 12,
    vehicle_insurance: 12,
    vehicle_registration: 36,
    payroll_stub: 12,
    id_card: 0,
    senior_documents: 12,
  }
  function addMonths(dateStr: string, months: number): string | null {
    if (!dateStr || !months) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    d.setMonth(d.getMonth() + months)
    return d.toISOString()
  }
  function addDays(dateStr: string, days: number): string | null {
    if (!dateStr || !days) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    d.setDate(d.getDate() + days)
    return d.toISOString()
  }

  // Advanced expiry policy with site overrides
  // 1) Lookup required_document_types ids for codes we know
  const { data: docTypes } = await supabase
    .from('required_document_types')
    .select('id, code')
    .in('code', REQUIRED_DOCUMENT_TYPES as any)

  const codeToId = new Map<string, string>()
  ;(docTypes || []).forEach((r: any) => codeToId.set(r.code, r.id))

  // 2) Collect active site IDs and read site overrides (site_required_documents)
  const activeSiteIds = (assignments || [])
    .filter((a: any) => a.is_active)
    .map((a: any) => a.site_id)
    .filter(Boolean)

  let overrideDaysByCode = new Map<string, number>()
  if (activeSiteIds.length > 0 && docTypes && docTypes.length > 0) {
    const docTypeIds = (docTypes || []).map((d: any) => d.id)
    const { data: siteOverrides } = await supabase
      .from('site_required_documents')
      .select('document_type_id, site_id, is_required, due_days')
      .in('site_id', activeSiteIds as any)
      .in('document_type_id', docTypeIds as any)

    // Aggregate per code: use the most conservative earliest due (min days)
    const tmpMap = new Map<string, number[]>()
    ;(siteOverrides || []).forEach((row: any) => {
      if (!row?.due_days) return
      const code = (docTypes || []).find((d: any) => d.id === row.document_type_id)?.code
      if (!code) return
      const list = tmpMap.get(code) || []
      list.push(Number(row.due_days))
      tmpMap.set(code, list)
    })
    tmpMap.forEach((list, code) => {
      if (list.length > 0) overrideDaysByCode.set(code, Math.min(...list))
    })
  }

  const required_documents = REQUIRED_DOCUMENT_TYPES.map(dt => {
    const doc = (userDocs || []).find((d: any) => d.document_type === dt)
    const submittedAt = doc?.upload_date || null
    const months = validityMonths[dt] ?? 0
    const overrideDays = overrideDaysByCode.get(dt)
    const expiresAt = submittedAt
      ? overrideDays && overrideDays > 0
        ? addDays(submittedAt, overrideDays)
        : months > 0
          ? addMonths(submittedAt, months)
          : null
      : null
    return {
      document_type: dt,
      status: doc ? 'submitted' : 'pending',
      submitted_at: submittedAt,
      expires_at: expiresAt,
      file_path: doc?.file_path || null,
      file_url: null,
    }
  })

  // file_url policy: private bucket `user-documents` → signed URL (1h)
  try {
    const service = createServiceClient()
    await Promise.all(
      required_documents.map(async rd => {
        if (!rd.file_path) return
        // Already a full URL? keep as-is.
        if (/^https?:\/\//i.test(rd.file_path)) {
          rd.file_url = rd.file_path
          return
        }
        const { data, error } = await service.storage
          .from('user-documents')
          .createSignedUrl(rd.file_path, 3600)
        if (!error && data?.signedUrl) rd.file_url = data.signedUrl
      })
    )
  } catch {
    // If service role is not available, leave file_url null and rely on download API
  }

  // Work log stats
  let total_reports = 0
  let this_month = 0
  let last_report_date: string | null = null
  try {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const { count: totalCount } = await supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
    const { count: monthCount } = await supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .gte('work_date', ym + '-01')
    const { data: last } = await supabase
      .from('daily_reports')
      .select('work_date')
      .eq('created_by', userId)
      .order('work_date', { ascending: false })
      .limit(1)
    total_reports = totalCount || 0
    this_month = monthCount || 0
    last_report_date = (last?.[0] as any)?.work_date || null
  } catch (e) {
    console.warn('[getUserDetail] work log stats fetch failed:', e)
  }

  return {
    id: String(base.id),
    full_name: (base as any).full_name || null,
    email: (base as any).email || null,
    role: (base as any).role || null,
    status: (base as any).status || null,
    phone: (base as any).phone || null,
    organization,
    site_assignments,
    required_documents,
    work_log_stats: {
      total_reports,
      this_month,
      last_report_date,
    },
  }
}
