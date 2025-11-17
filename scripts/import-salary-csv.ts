/*
  Import daily salary CSV and generate monthly salary snapshots per worker.

  Input CSV headers (Korean):
    일자, 작업자, 현장, 공수, 기본값(단가), 총급여, 세금(3.3%), 실수령액, 메모

  Behavior:
    - Parses rows, skips group rows like "외" or zero amounts
    - Maps 작업자 → profiles.full_name → worker_id
    - Maps 현장 → sites.name → site_id
    - Groups by worker_id + YYYY-MM and computes monthly aggregates
    - Saves snapshots to Storage bucket 'documents' at salary-snapshots/{worker_id}/{YYYY-MM}.json

  Usage:
    npm run import:salary -- --file=./급여정보.csv --dry-run

  Env:
    NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

interface RawRow {
  [key: string]: any
}

interface ParsedRow {
  date: string // YYYY-MM-DD
  workerName: string
  siteName: string
  manDays: number
  baseRate: number
  grossPay: number
  tax: number
  netPay: number
  notes: string
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue
    const [k, v] = a.replace(/^--/, '').split('=')
    args[k] = v === undefined ? true : v
  }
  const file = String(args.file || args.f || '')
  const dryRun = Boolean(args['dry-run'] || args.dry || false)
  return { file, dryRun }
}

function readRows(filePath: string): RawRow[] {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  const wb = XLSX.readFile(filePath, { raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('No sheet found')
  return XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' })
}

function normalizeKey(k: string): string {
  return String(k || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_-]+/g, '')
}

function toISODate(dotDate: string): string | null {
  // 2025.1.2 → 2025-01-02
  const s = String(dotDate || '')
    .trim()
    .replace(/\s+/g, '')
  const m = s.match(/^(\d{4})[.](\d{1,2})[.](\d{1,2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = String(Number(m[2])).padStart(2, '0')
  const d = String(Number(m[3])).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function parseNumber(v: any): number {
  if (typeof v === 'number') return v
  const s = String(v || '')
    .replace(/,/g, '')
    .trim()
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

async function main() {
  const { file, dryRun } = parseArgs(process.argv)
  if (!file) {
    console.error('Usage: tsx scripts/import-salary-csv.ts --file=./급여정보.csv [--dry-run]')
    process.exit(1)
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const rows = readRows(path.resolve(process.cwd(), file))

  // map headers
  const parsed: ParsedRow[] = []
  for (const r of rows) {
    const km: Record<string, string> = {}
    for (const k of Object.keys(r)) km[normalizeKey(k)] = k
    const kDate = km['일자'] || km['date']
    const kWorker = km['작업자'] || km['이름'] || km['성명'] || km['worker']
    const kSite = km['현장'] || km['site']
    const kMan = km['공수'] || km['mandays']
    const kRate = km['기본값(단가)'] || km['단가'] || km['dailyrate']
    const kGross = km['총급여'] || km['총액'] || km['gross']
    const kTax = km['세금(3.3%)'] || km['세금'] || km['tax']
    const kNet = km['실수령액'] || km['net']
    const kMemo = km['메모'] || km['비고'] || km['notes']
    if (!kDate || !kWorker || !kSite) continue
    const dateIso = toISODate(r[kDate])
    if (!dateIso) continue
    const workerName = String(r[kWorker] || '').trim()
    const siteName = String(r[kSite] || '').trim()
    const manDays = parseNumber(r[kMan])
    const baseRate = parseNumber(r[kRate])
    const gross = parseNumber(r[kGross])
    const tax = parseNumber(r[kTax])
    const net = parseNumber(r[kNet])
    const notes = String(r[kMemo] || '').trim()
    // skip group rows like "외" or zero amounts
    if (/외\s*$/.test(workerName)) continue
    if (gross === 0 && net === 0 && tax === 0) continue
    parsed.push({
      date: dateIso,
      workerName,
      siteName,
      manDays,
      baseRate,
      grossPay: gross,
      tax,
      netPay: net,
      notes,
    })
  }

  if (parsed.length === 0) {
    console.error('No valid rows parsed')
    process.exit(1)
  }

  // Resolve users and sites
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Load site alias map if present
  let aliasMap: Record<string, string> = {}
  try {
    const aliasPath = path.resolve(process.cwd(), 'scripts/config/site-aliases.json')
    if (fs.existsSync(aliasPath)) {
      aliasMap = JSON.parse(fs.readFileSync(aliasPath, 'utf8'))
    }
  } catch (err) {
    console.warn('⚠️ Failed to load site alias map:', err)
  }

  const normalizeSite = (name: string) => aliasMap[name] || name

  const workerNames = Array.from(new Set(parsed.map(p => p.workerName)))
  const siteNames = Array.from(new Set(parsed.map(p => normalizeSite(p.siteName))))

  const userIdByName = new Map<string, string>()
  if (workerNames.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('full_name', workerNames)
    for (const row of data || [])
      userIdByName.set(String((row as any).full_name), String((row as any).id))
  }

  const siteIdByName = new Map<string, string>()
  if (siteNames.length > 0) {
    // query in chunks
    for (let i = 0; i < siteNames.length; i += 1000) {
      const subset = siteNames.slice(i, i + 1000)
      const { data } = await supabase.from('sites').select('id, name').in('name', subset)
      for (const row of data || [])
        siteIdByName.set(String((row as any).name), String((row as any).id))
    }
  }

  const unresolvedUsers = workerNames.filter(n => !userIdByName.has(n))
  const unresolvedSites = siteNames.filter(n => !siteIdByName.has(n))
  if (unresolvedUsers.length > 0) console.warn('⚠️ 사용자 매칭 실패:', unresolvedUsers)
  if (unresolvedSites.length > 0) console.warn('⚠️ 현장 매칭 실패:', unresolvedSites)

  // Group by worker + month
  type Key = string // `${workerId}__YYYY-MM`
  const groups = new Map<Key, ParsedRow[]>()
  for (const row of parsed) {
    const uid = userIdByName.get(row.workerName)
    if (!uid) continue
    const ym = row.date.slice(0, 7)
    const key = `${uid}__${ym}`
    const arr = groups.get(key) || []
    arr.push({ ...row, siteName: normalizeSite(row.siteName) })
    groups.set(key, arr)
  }

  const snapshots: Array<{ path: string; json: any }> = []
  for (const [key, rowsOfGroup] of groups) {
    const [workerId, ym] = key.split('__')
    const [yStr, mStr] = ym.split('-')
    const year = Number(yStr)
    const month = Number(mStr)

    const dates = rowsOfGroup.map(r => r.date)
    const periodStart = dates.slice().sort()[0]
    const periodEnd = dates.slice().sort().slice(-1)[0]
    const workDays = new Set(rowsOfGroup.filter(r => r.manDays > 0).map(r => r.date)).size
    const totalManDays = rowsOfGroup.reduce(
      (s, r) => s + (Number.isFinite(r.manDays) ? r.manDays : 0),
      0
    )
    const basePay = rowsOfGroup.reduce((s, r) => s + r.grossPay, 0)
    const tax = rowsOfGroup.reduce((s, r) => s + r.tax, 0)
    const net = rowsOfGroup.reduce((s, r) => s + r.netPay, 0)
    const siteCount = new Set(rowsOfGroup.map(r => r.siteName)).size
    // daily rate: most frequent baseRate
    const rateCount = new Map<number, number>()
    for (const r of rowsOfGroup) {
      if (!Number.isFinite(r.baseRate) || r.baseRate <= 0) continue
      rateCount.set(r.baseRate, (rateCount.get(r.baseRate) || 0) + 1)
    }
    let dailyRate: number | null = null
    if (rateCount.size > 0) {
      dailyRate = Array.from(rateCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
    }

    const snapshot = {
      worker_id: workerId,
      year,
      month,
      month_label: `${year}-${String(month).padStart(2, '0')}`,
      snapshot_version: 'v1',
      html_template_version: 'korean-v1',
      issued_at: new Date().toISOString(),
      issuer_id: 'service-import',
      status: 'issued',
      employment_type: 'daily_worker',
      daily_rate: dailyRate,
      siteCount,
      workDays,
      totalManDays,
      salary: {
        work_days: workDays,
        total_labor_hours: Math.round(totalManDays * 8 * 100) / 100,
        total_work_hours: Math.round(totalManDays * 8 * 100) / 100,
        total_overtime_hours: 0,
        base_pay: basePay,
        total_gross_pay: basePay,
        tax_deduction: tax,
        national_pension: 0,
        health_insurance: 0,
        employment_insurance: 0,
        total_deductions: tax,
        net_pay: net,
        period_start: periodStart,
        period_end: periodEnd,
      },
    }

    const filePath = `salary-snapshots/${workerId}/${snapshot.month_label}.json`
    snapshots.push({ path: filePath, json: snapshot })
  }

  console.log(`파싱 ${parsed.length}건 → 스냅샷 ${snapshots.length}건 생성 예정`)
  if (dryRun) {
    console.log(
      '샘플:',
      snapshots.slice(0, 2).map(s => ({ path: s.path, preview: s.json.salary }))
    )
    console.log('드라이런: 업로드 생략')
    return
  }

  // Upload to storage (upsert)
  for (const s of snapshots) {
    const payload = new Blob([JSON.stringify(s.json, null, 2)], { type: 'application/json' })
    const { error } = await supabase.storage
      .from('documents')
      .upload(s.path, payload, { upsert: true })
    if (error) {
      console.error('업로드 실패:', s.path, error.message)
    } else {
      console.log('✓ 업로드:', s.path)
    }
  }

  console.log('완료')
}

main().catch(err => {
  console.error('[import-salary-csv] 실패:', err?.message || err)
  process.exit(1)
})
