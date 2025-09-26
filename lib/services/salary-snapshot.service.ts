import { createClient } from '@/lib/supabase/server'

export type SnapshotSource = 'db' | 'storage'

export interface SalarySnapshot {
  worker_id: string
  year: number
  month: number
  month_label: string
  snapshot_version: string
  html_template_version: string
  issued_at: string
  issuer_id: string
  status?: 'issued' | 'approved' | 'paid'
  approved_at?: string | null
  approver_id?: string | null
  paid_at?: string | null
  payer_id?: string | null
  employment_type: string | null
  daily_rate: number | null
  siteCount: number
  workDays: number
  totalManDays: number
  salary: {
    work_days: number
    total_labor_hours: number
    total_work_hours: number
    total_overtime_hours: number
    base_pay: number
    overtime_pay: number
    bonus_pay: number
    total_gross_pay: number
    tax_deduction: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    total_deductions: number
    net_pay: number
    period_start: string
    period_end: string
  }
}

function getSnapshotPath(workerId: string, year: number, month: number) {
  const ym = `${year}-${String(month).padStart(2, '0')}`
  return `salary-snapshots/${workerId}/${ym}.json`
}

export async function getSalarySnapshot(
  workerId: string,
  year: number,
  month: number
): Promise<{ snapshot: SalarySnapshot | null; source?: SnapshotSource }> {
  const supabase = createClient()

  // 1) Try DB table first (if exists)
  try {
    const { data, error } = await supabase
      .from('salary_snapshots')
      .select('*')
      .eq('worker_id', workerId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    if (!error && data && data.data_json) {
      return { snapshot: data.data_json as SalarySnapshot, source: 'db' }
    }
  } catch (e) {
    // table may not exist – fall through to storage
  }

  // 2) Fallback to Storage(JSON) in 'documents' bucket
  try {
    const path = getSnapshotPath(workerId, year, month)
    const { data: file, error } = await supabase.storage.from('documents').download(path)
    if (!error && file) {
      const text = await file.text()
      const json = JSON.parse(text) as SalarySnapshot
      return { snapshot: json, source: 'storage' }
    }
  } catch (e) {
    // ignore
  }

  return { snapshot: null }
}

export async function saveSalarySnapshot(
  snapshot: SalarySnapshot
): Promise<{ success: boolean; source?: SnapshotSource; error?: string }> {
  const supabase = createClient()

  // 1) Try DB upsert when table exists
  try {
    const { error } = await supabase.from('salary_snapshots').upsert({
      worker_id: snapshot.worker_id,
      year: snapshot.year,
      month: snapshot.month,
      data_json: snapshot,
      issued_at: snapshot.issued_at,
      issuer_id: snapshot.issuer_id,
      snapshot_version: snapshot.snapshot_version,
      html_template_version: snapshot.html_template_version,
      status: snapshot.status || 'issued',
      approved_at: snapshot.approved_at || null,
      approver_id: snapshot.approver_id || null,
      paid_at: snapshot.paid_at || null,
      payer_id: snapshot.payer_id || null,
    })
    if (!error) {
      return { success: true, source: 'db' }
    }
  } catch (e: any) {
    // fall through to storage
  }

  // 2) Fallback to Storage(JSON) in 'documents' bucket
  try {
    const path = getSnapshotPath(snapshot.worker_id, snapshot.year, snapshot.month)
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const { error } = await supabase.storage.from('documents').upload(path, blob, { upsert: true })
    if (!error) {
      return { success: true, source: 'storage' }
    }
    return { success: false, error: error?.message }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Snapshot save failed' }
  }
}

export async function listSalarySnapshots(params: {
  workerId?: string
  year?: number
  month?: number
  status?: 'issued' | 'approved' | 'paid'
  limit?: number
}): Promise<{ snapshots: SalarySnapshot[] }> {
  const supabase = createClient()
  const { workerId, year, month, status, limit = 50 } = params

  try {
    let query = supabase
      .from('salary_snapshots')
      .select(
        'worker_id, year, month, data_json, issued_at, issuer_id, status, approved_at, approver_id, paid_at, payer_id'
      )
      .order('issued_at', { ascending: false })
      .limit(limit)

    if (workerId) query = query.eq('worker_id', workerId)
    if (year) query = query.eq('year', year)
    if (month) query = query.eq('month', month)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      const snapshots = data
        .map(r => {
          const snap = (r as any).data_json as SalarySnapshot
          if (snap) {
            snap.status = (r as any).status || snap.status || 'issued'
            snap.approved_at = (r as any).approved_at || snap.approved_at || null
            snap.approver_id = (r as any).approver_id || snap.approver_id || null
            snap.paid_at = (r as any).paid_at || snap.paid_at || null
            snap.payer_id = (r as any).payer_id || snap.payer_id || null
          }
          return snap
        })
        .filter(Boolean)
      return { snapshots }
    }
  } catch (e) {
    // fall through to storage listing
  }

  if (!workerId) {
    return { snapshots: [] }
  }

  try {
    const base = `salary-snapshots/${workerId}`
    const { data: files, error } = await supabase.storage.from('documents').list(base, {
      limit,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (error || !files) return { snapshots: [] }
    const snapshots: SalarySnapshot[] = []
    for (const f of files) {
      if (!f.name.endsWith('.json')) continue
      const [ym] = f.name.split('.json')
      const [yStr, mStr] = ym.split('-')
      if (!yStr || !mStr) continue
      const y = Number(yStr)
      const m = Number(mStr)
      const { snapshot } = await getSalarySnapshot(workerId, y, m)
      if (snapshot) snapshots.push(snapshot)
    }
    const filtered = status ? snapshots.filter(s => s.status === status) : snapshots
    return { snapshots: filtered }
  } catch (e) {
    return { snapshots: [] }
  }
}

export async function approveSalarySnapshot(
  workerId: string,
  year: number,
  month: number,
  approverId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const approved_at = new Date().toISOString()
  try {
    const { error } = await supabase
      .from('salary_snapshots')
      .update({ status: 'approved', approved_at, approver_id: approverId })
      .eq('worker_id', workerId)
      .eq('year', year)
      .eq('month', month)
    if (!error) return { success: true }
  } catch (e) {
    // fall through
  }

  try {
    const { snapshot } = await getSalarySnapshot(workerId, year, month)
    if (!snapshot) return { success: false, error: 'Snapshot not found' }
    snapshot.status = 'approved'
    snapshot.approved_at = approved_at
    snapshot.approver_id = approverId
    const res = await saveSalarySnapshot(snapshot)
    return { success: res.success, error: res.error }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Approve failed' }
  }
}

export async function paySalarySnapshot(
  workerId: string,
  year: number,
  month: number,
  payerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const paid_at = new Date().toISOString()
  try {
    const { error } = await supabase
      .from('salary_snapshots')
      .update({ status: 'paid', paid_at, payer_id: payerId })
      .eq('worker_id', workerId)
      .eq('year', year)
      .eq('month', month)
    if (!error) return { success: true }
  } catch (e) {
    // fall through
  }

  try {
    const { snapshot } = await getSalarySnapshot(workerId, year, month)
    if (!snapshot) return { success: false, error: 'Snapshot not found' }
    snapshot.status = 'paid'
    snapshot.paid_at = paid_at
    snapshot.payer_id = payerId
    const res = await saveSalarySnapshot(snapshot)
    return { success: res.success, error: res.error }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Pay failed' }
  }
}
