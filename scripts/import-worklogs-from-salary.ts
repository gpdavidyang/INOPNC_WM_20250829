/*
  Create daily_reports from a salary CSV to backfill worklogs per site-date.

  Input CSV headers:
    일자, 작업자, 현장, 공수, 기본값(단가), 총급여, 세금(3.3%), 실수령액, 메모

  Strategy:
    - Group by (siteName, date)
    - Resolve site_id by sites.name
    - Resolve created_by as any admin profile (fallback: any profile)
    - Insert daily_reports if not exists for (site_id, work_date)
      minimal columns: site_id, work_date, weather='sunny', work_description,
      total_workers=#distinct workers that day, total_labor_hours=sum(manDays)*8

  Usage:
    npm run import:worklogs -- --file=./급여정보.csv --dry-run

  Env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
*/

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

interface RawRow { [key: string]: any }

interface Item {
  date: string // YYYY-MM-DD
  worker: string
  site: string
  manDays: number
}

function parseArgs(argv: string[]) {
  const a: Record<string, string | boolean> = {}
  for (const s of argv.slice(2)) {
    if (!s.startsWith('--')) continue
    const [k, v] = s.replace(/^--/, '').split('=')
    a[k] = v === undefined ? true : v
  }
  return { file: String(a.file || a.f || ''), dryRun: Boolean(a['dry-run'] || a.dry) }
}

function toISODate(dotDate: string): string | null {
  const s = String(dotDate || '').trim()
  const m = s.match(/^(\d{4})[.](\d{1,2})[.](\d{1,2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = String(Number(m[2])).padStart(2, '0')
  const d = String(Number(m[3])).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function parseNumber(v: any): number {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/,/g, '').trim()
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function normalizeKey(k: string): string {
  return String(k || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[_-]+/g, '')
}

function readRows(filePath: string): RawRow[] {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  const wb = XLSX.readFile(filePath, { raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('No sheet found')
  return XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' })
}

async function main() {
  const { file, dryRun } = parseArgs(process.argv)
  if (!file) {
    console.error('Usage: tsx scripts/import-worklogs-from-salary.ts --file=./급여정보.csv [--dry-run]')
    process.exit(1)
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const rows = readRows(path.resolve(process.cwd(), file))
  // Load site alias map to normalize names
  let aliasMap: Record<string, string> = {}
  try {
    const aliasPath = path.resolve(process.cwd(), 'scripts/config/site-aliases.json')
    if (fs.existsSync(aliasPath)) aliasMap = JSON.parse(fs.readFileSync(aliasPath, 'utf8'))
  } catch {}
  const normalizeSite = (name: string) => aliasMap[name] || name
  const items: Item[] = []
  for (const r of rows) {
    const km: Record<string, string> = {}
    for (const k of Object.keys(r)) km[normalizeKey(k)] = k
    const kDate = km['일자'] || km['date']
    const kWorker = km['작업자'] || km['이름'] || km['성명'] || km['worker']
    const kSite = km['현장'] || km['site']
    const kMan = km['공수'] || km['mandays']
    if (!kDate || !kWorker || !kSite) continue
    const dateIso = toISODate(r[kDate])
    if (!dateIso) continue
    const workerName = String(r[kWorker] || '').trim()
    const siteName = normalizeSite(String(r[kSite] || '').trim())
    if (/외\s*$/.test(workerName)) continue
    items.push({ date: dateIso, worker: workerName, site: siteName, manDays: parseNumber(r[kMan]) })
  }

  if (items.length === 0) {
    console.error('No valid rows')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

  // Resolve admin created_by
  let createdBy: string | null = null
  {
    const { data } = await supabase.from('profiles').select('id, role').in('role', ['admin', 'system_admin']).limit(1)
    if (data && data[0]) createdBy = String((data[0] as any).id)
    if (!createdBy) {
      const { data: anyP } = await supabase.from('profiles').select('id').limit(1)
      createdBy = anyP && anyP[0] ? String((anyP[0] as any).id) : null
    }
    if (!createdBy) {
      console.error('No profile found to set created_by')
      process.exit(1)
    }
  }

  // Resolve sites
  const siteNames = Array.from(new Set(items.map(i => i.site)))
  const { data: siteRows } = await supabase.from('sites').select('id, name').in('name', siteNames)
  const siteIdByName = new Map<string, string>()
  for (const row of siteRows || []) siteIdByName.set(String((row as any).name), String((row as any).id))
  const unresolved = siteNames.filter(n => !siteIdByName.has(n))
  if (unresolved.length) console.warn('⚠️ 현장 매핑 실패(작업일지):', unresolved)

  // Group by site-date
  type Key = string // `${site}__${date}`
  const grouped = new Map<Key, Item[]>()
  for (const it of items) {
    const key = `${it.site}__${it.date}`
    const arr = grouped.get(key) || []
    arr.push(it)
    grouped.set(key, arr)
  }

  // Prepare inserts
  const inserts: any[] = []
  for (const [key, rowsOfDay] of grouped) {
    const [siteName, date] = key.split('__')
    const siteId = siteIdByName.get(siteName)
    if (!siteId) continue
    const totalWorkers = new Set(rowsOfDay.map(r => r.worker)).size
    // Build richer work content deterministically by site+date
    const pools = {
      member: ['슬라브', '거더', '벽체', '기둥', '기초', '데크', '보', '바닥'] as const,
      process: ['균열', '면', '마감', '콘크리트', '철근', '거푸집'] as const,
      section: ['지하 1층', '지하 2층', '1층', '2층', '3층', '옥상', '외부'] as const,
      component: ['기타', '코어', '링', '캡', '슬라브 보수'] as const,
    }
    const hash = (s: string) => {
      let h = 0
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
      return h
    }
    const seed = hash(siteName + date)
    const pick = (arr: readonly string[], mod: number) => arr[Math.abs(mod) % arr.length]
    const member_name = pick(pools.member as any, seed)
    const process_type = pick(pools.process as any, seed >> 3)
    const work_process = process_type
    const work_section = pick(pools.section as any, seed >> 5)
    const component_name = pick(pools.component as any, seed >> 7)
    const issues = '급여기록 기반 자동 생성'

    inserts.push({
      site_id: siteId,
      work_date: date,
      total_workers: totalWorkers,
      member_name,
      process_type,
      work_process,
      work_section,
      component_name,
      issues,
      created_by: createdBy,
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  console.log(`생성 예정 일지: ${inserts.length}건 (site-date 기준)`)
  if (dryRun) {
    console.log('샘플 3건:', inserts.slice(0, 3))
    return
  }

  // Insert with conflict skip if already exists (site_id, work_date)
  for (const payload of inserts) {
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('site_id', payload.site_id)
      .eq('work_date', payload.work_date)
      .maybeSingle()
    if (existing) continue
    const { data: insertedRows, error } = await supabase
      .from('daily_reports')
      .insert(payload)
      .select('id')
      .limit(1)
    if (error) {
      console.error('삽입 실패:', payload.site_id, payload.work_date, error.message)
    } else {
      const reportId = insertedRows && insertedRows[0] ? String((insertedRows[0] as any).id) : null
      console.log('✓ 생성:', payload.work_date, 'site', payload.site_id)
      // Auto-attach site documents if available
      if (reportId) {
        try {
          const { data: docs } = await supabase
            .from('unified_documents')
            .select('file_url, file_name, mime_type, category_type, sub_type')
            .eq('site_id', payload.site_id)
            .limit(10)
          const pickAttachments = (list: any[]) => {
            const out: { file_url: string; file_name: string; document_type: string }[] = []
            if (!Array.isArray(list)) return out
            // one drawing if available
            const drawing = list.find(
              d =>
                String(d?.category_type || '').includes('drawing') ||
                String(d?.sub_type || '').includes('drawing')
            )
            if (drawing && drawing.file_url) {
              out.push({ file_url: drawing.file_url, file_name: drawing.file_name || '도면', document_type: 'drawing' })
            }
            // up to two photos by mime
            const photos = list.filter(d => String(d?.mime_type || '').startsWith('image/')).slice(0, 2)
            for (const p of photos) {
              if (p?.file_url) out.push({ file_url: p.file_url, file_name: p.file_name || '사진', document_type: 'photo' })
            }
            // one confirmation-like doc
            const conf = list.find(d => String(d?.category_type || '').includes('confirmation'))
            if (conf && conf.file_url) {
              out.push({ file_url: conf.file_url, file_name: conf.file_name || '완료문서', document_type: 'confirmation' })
            }
            return out
          }
          const atts = pickAttachments(docs || [])
          if (atts.length > 0) {
            const rows = atts.map(a => ({
              daily_report_id: reportId,
              file_name: a.file_name,
              file_url: a.file_url,
              file_size: null,
              document_type: a.document_type,
              uploaded_at: new Date().toISOString(),
            }))
            const { error: attErr } = await supabase.from('document_attachments').insert(rows as any)
            if (attErr) console.warn('첨부 기록 실패:', attErr.message)
          }
        } catch (e: any) {
          console.warn('첨부 자동 연결 중 오류:', e?.message || e)
        }
      }
    }
  }

  console.log('완료')
}

main().catch(err => {
  console.error('[import-worklogs-from-salary] 실패:', err?.message || err)
  process.exit(1)
})
