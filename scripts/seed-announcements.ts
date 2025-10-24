/*
  Seed 5 announcement rows into Supabase using service role key.
  It auto-loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local if not present.
*/
import { createClient as createSbClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function ensureEnv() {
  const needed = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const
  const missing = needed.filter(k => !process.env[k])
  if (missing.length === 0) return
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing env vars ${missing.join(', ')} and .env.local not found`)
  }
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    let val = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (needed.includes(key as any) && !process.env[key]) {
      process.env[key] = val
    }
  }
  const stillMissing = needed.filter(k => !process.env[k])
  if (stillMissing.length) {
    throw new Error(`Missing env vars: ${stillMissing.join(', ')}`)
  }
}

async function main() {
  ensureEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createSbClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Load all site ids; fallback to empty list
  const { data: sites, error: sitesErr } = await supabase.from('sites').select('id')
  if (sitesErr) {
    console.warn(
      'Warning: failed to load sites, proceeding with empty target_sites:',
      sitesErr.message
    )
  }
  const siteIds: string[] = (sites || []).map((s: any) => s.id)

  const now = new Date().toISOString()
  const samples = [
    {
      title: '시스템 점검 안내',
      content: '다음 주 화요일 02:00~04:00 시스템 점검이 진행됩니다.',
      priority: 'high',
    },
    {
      title: '안전 교육 일정 공지',
      content: '월말 안전 교육이 예정되어 있으니 필수 참석 바랍니다.',
      priority: 'urgent',
    },
    {
      title: '신규 기능 업데이트',
      content: '모바일 작업일지 V2가 배포되었습니다. 새 기능을 확인하세요.',
      priority: 'normal',
    },
    {
      title: '자재 반입 절차 변경',
      content: '자재 반입 승인 절차가 간소화되었습니다. 문서를 확인하세요.',
      priority: 'low',
    },
    {
      title: '휴무일 안내',
      content: '다음 주 월요일 현장 전체 휴무입니다. 일정에 참고하세요.',
      priority: 'normal',
    },
  ]

  const rows = samples.map(s => ({
    title: s.title,
    content: s.content,
    priority: s.priority,
    target_sites: siteIds,
    target_roles: [],
    is_active: true,
    created_at: now,
  }))

  const { data, error } = await supabase.from('announcements').insert(rows).select('id,title')
  if (error) {
    throw new Error('Insert failed: ' + error.message)
  }
  console.log('Seeded announcements:', data)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
