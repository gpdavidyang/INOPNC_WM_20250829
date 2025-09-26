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
