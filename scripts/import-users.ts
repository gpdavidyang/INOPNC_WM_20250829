/*
  Bulk import users from CSV/XLSX/TSV with Korean name/role and auto-generate emails with @inopnc.com.

  - Input columns (case-insensitive; Korean synonyms supported):
    - name | 이름 | 성명
    - role | 역할

  - Role mapping (Korean → system role):
    현장관리자 → site_manager
    작업자     → worker
    본사관리자 → admin (변경 원하면 --hq-role=system_admin)
    생산관리자 → production_manager
    파트너사   → partner
    고객담당자 → customer_manager

  - Email generation: romanize Hangul to ASCII (basic), lowercased, remove non-alphanum.
    Pattern: <romanized>[<seq>]@inopnc.com
    If romanized empty, fallback to user<seq>@inopnc.com

  Usage:
    npm run import:users -- --file=./users.csv --dry-run
    npm run import:users -- --file=./users.csv --hq-role=system_admin --password='Init!2345'

  Env:
    NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
*/
/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

type UserRole =
  | 'worker'
  | 'site_manager'
  | 'customer_manager'
  | 'partner'
  | 'admin'
  | 'system_admin'
  | 'production_manager'

interface RawRow {
  [key: string]: any
}

interface InputUser {
  name: string
  role: string
}

interface PlannedUser {
  name: string
  role: UserRole
  email: string
}

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {}
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue
    const [k, v] = a.replace(/^--/, '').split('=')
    out[k] = v === undefined ? true : v
  }
  const file = String(out.file || out.f || '')
  const dryRun = Boolean(out['dry-run'] || out.dry || false)
  const hqRole = String(out['hq-role'] || 'admin') as 'admin' | 'system_admin'
  const password = String(out['password'] || 'Init!2345')
  return { file, dryRun, hqRole, password }
}

function normalizeKey(k: string): string {
  return String(k || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[_-]+/g, '')
}

function readSheet(filePath: string): RawRow[] {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  const wb = XLSX.readFile(filePath, { raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('No sheet found')
  return XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' })
}

function roleMap(raw: string, hqRole: 'admin' | 'system_admin'): UserRole | null {
  const s = String(raw || '').trim()
  if (!s) return null
  const base = s.replace(/\s+/g, '')
  if (base === '현장관리자') return 'site_manager'
  if (base === '작업자') return 'worker'
  if (base === '본사관리자') return hqRole
  if (base === '생산관리자') return 'production_manager'
  if (base === '파트너사') return 'partner'
  if (base === '고객담당자') return 'customer_manager'
  // English direct mapping fallback
  const low = s.toLowerCase()
  const map: Record<string, UserRole> = {
    worker: 'worker',
    site_manager: 'site_manager',
    admin: 'admin',
    system_admin: 'system_admin',
    production_manager: 'production_manager',
    partner: 'partner',
    customer_manager: 'customer_manager',
  }
  return map[low] || null
}

// Basic Hangul romanization (choseong/jungsung/jongseong mapping)
const L = [
  'g',
  'kk',
  'n',
  'd',
  'tt',
  'r',
  'm',
  'b',
  'pp',
  's',
  'ss',
  '',
  'j',
  'jj',
  'ch',
  'k',
  't',
  'p',
  'h',
]
const V = [
  'a',
  'ae',
  'ya',
  'yae',
  'eo',
  'e',
  'yeo',
  'ye',
  'o',
  'wa',
  'wae',
  'oe',
  'yo',
  'u',
  'weo',
  'we',
  'wi',
  'yu',
  'eu',
  'ui',
  'i',
]
const T = [
  '',
  'k',
  'k',
  'ks',
  'n',
  'nj',
  'nh',
  't',
  'l',
  'lk',
  'lm',
  'lb',
  'ls',
  'lt',
  'lp',
  'lh',
  'm',
  'p',
  'ps',
  't',
  't',
  'ng',
  't',
  't',
  'k',
  't',
  'p',
  't',
]

function romanizeKorean(input: string): string {
  const BASE = 0xac00
  const LAST = 0xd7a3
  const chars: string[] = []
  for (const ch of input) {
    const code = ch.codePointAt(0) || 0
    if (code >= BASE && code <= LAST) {
      const sIndex = code - BASE
      const l = Math.floor(sIndex / 588)
      const v = Math.floor((sIndex % 588) / 28)
      const t = sIndex % 28
      chars.push(L[l] + V[v] + T[t])
    } else if (/^[A-Za-z0-9]+$/.test(ch)) {
      chars.push(ch)
    } else if (/[\s._-]+/.test(ch)) {
      chars.push('.')
    } else {
      // skip other chars
    }
  }
  const s = chars.join('').toLowerCase()
  return s.replace(/[^a-z0-9]+/g, '')
}

function dedupeBy<T>(arr: T[], keyFn: (t: T) => string) {
  const map = new Map<string, T>()
  for (const it of arr) map.set(keyFn(it), it)
  return Array.from(map.values())
}

async function main() {
  const { file, dryRun, hqRole, password } = parseArgs(process.argv)
  if (!file) {
    console.error('Usage: tsx scripts/import-users.ts --file=./users.csv [--dry-run] [--hq-role=admin|system_admin] [--password=...]')
    process.exit(1)
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const rows = readSheet(path.resolve(process.cwd(), file))
  const mapped: InputUser[] = []
  for (const row of rows) {
    const keyMap: Record<string, string> = {}
    for (const k of Object.keys(row)) keyMap[normalizeKey(k)] = k
    const nameKey = keyMap['name'] || keyMap['이름'] || keyMap['성명']
    const roleKey = keyMap['role'] || keyMap['역할']
    if (!nameKey || !roleKey) continue
    const name = String(row[nameKey] || '').trim()
    const role = String(row[roleKey] || '').trim()
    if (!name || !role) continue
    mapped.push({ name, role })
  }

  // Filter out group markers like "외"
  const cleaned = mapped.filter(u => !/외\s*$/.test(u.name))

  // 1) Deduplicate identical rows first (name+role)
  const unique = dedupeBy(cleaned, u => `${u.name}__${u.role}`)

  // 2) Map roles to system roles
  const mappedRoles: { name: string; role: UserRole }[] = []
  const unknowns: InputUser[] = []
  for (const u of unique) {
    const r = roleMap(u.role, hqRole)
    if (!r) unknowns.push(u)
    else mappedRoles.push({ name: u.name, role: r })
  }

  // 3) Unify by name: one person → one role (with priority)
  const rolePriority: UserRole[] = [
    'admin',
    'system_admin',
    'site_manager',
    'production_manager',
    'partner',
    'customer_manager',
    'worker',
  ]
  const byName = new Map<string, Set<UserRole>>()
  for (const r of mappedRoles) {
    const set = byName.get(r.name) || new Set<UserRole>()
    set.add(r.role)
    byName.set(r.name, set)
  }
  const planned: PlannedUser[] = []
  for (const [name, roles] of byName.entries()) {
    // pick highest priority role
    let chosen: UserRole | null = null
    for (const pr of rolePriority) {
      if (roles.has(pr)) {
        chosen = pr
        break
      }
    }
    if (!chosen) continue
    planned.push({ name, role: chosen, email: '' })
  }

  if (unknowns.length > 0) {
    console.warn(`⚠️ 알 수 없는 역할 ${unknowns.length}건:`, unknowns.slice(0, 5))
  }

  // Generate emails with @inopnc.com and ensure uniqueness
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Load existing emails from profiles for conflict check
  const baseEmails = planned.map(p => `${romanizeKorean(p.name) || 'user'}@inopnc.com`)
  const uniqueBases = Array.from(new Set(baseEmails))
  let existingEmails = new Set<string>()
  if (uniqueBases.length > 0) {
    // Fetch in chunks to avoid IN limit
    existingEmails = new Set<string>()
    const chunkSize = 1000
    for (let i = 0; i < uniqueBases.length; i += chunkSize) {
      const subset = uniqueBases.slice(i, i + chunkSize)
      const { data } = await supabase.from('profiles').select('email').in('email', subset)
      for (const row of data || []) existingEmails.add(String((row as any).email || ''))
    }
  }

  const plannedEmails = new Set<string>()
  for (const p of planned) {
    const baseLocal = romanizeKorean(p.name) || 'user'
    let local = baseLocal
    let seq = 0
    let candidate = `${local}@inopnc.com`
    while (plannedEmails.has(candidate) || existingEmails.has(candidate)) {
      seq += 1
      candidate = `${local}${seq}@inopnc.com`
    }
    p.email = candidate.toLowerCase()
    plannedEmails.add(candidate)
  }

  console.log(`총 ${mapped.length}건 중 유효 ${planned.length}건 (제외 ${mapped.length - planned.length}).`)
  console.log(`생성 예정 계정 수: ${planned.length}`)
  console.log('샘플 5건:', planned.slice(0, 5))

  if (dryRun) {
    console.log('드라이런이므로 DB 변경 없음.')
    return
  }

  // Create users and profiles
  for (const p of planned) {
    // 1) Auth user (id 확보)
    let userId: string | null = null
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: p.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: p.name, role: p.role },
      })
      if (error && !String(error.message || '').toLowerCase().includes('already')) {
        throw error
      }
      userId = data?.user?.id || null
      if (!userId) {
        const list = await supabase.auth.admin.listUsers()
        const match = list?.data?.users?.find(u => (u.email || '').toLowerCase() === p.email)
        userId = match?.id || null
      }
    } catch (e: any) {
      console.error(`[auth] 사용자 생성 실패: ${p.email} (${p.name})`, e?.message || e)
      continue
    }
    if (!userId) {
      console.error(`[auth] 사용자 ID를 확인할 수 없음: ${p.email}`)
      continue
    }

    // 2) profiles 업서트
    const { error: upsertErr } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email: p.email,
        full_name: p.name,
        role: p.role,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'id' }
    )
    if (upsertErr) {
      console.error(`[profiles] 업서트 실패: ${p.email} (${p.name})`, upsertErr.message)
      continue
    }
    console.log(`✓ 생성/업서트 완료: ${p.email} (${p.role})`)
  }

  console.log('완료')
}

main().catch(err => {
  console.error('[import-users] 실패:', err?.message || err)
  process.exit(1)
})
