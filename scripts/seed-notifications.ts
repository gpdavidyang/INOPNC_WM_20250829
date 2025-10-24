/*
  Seed 5 notification_log rows for a target user.
  Priority order to choose target user:
  1) process.env.SEED_TARGET_USER_ID
  2) first profile with role in ['site_manager','worker']
  3) first profile
  4) fallback to 'dev-user-001' (dev bypass)
*/
import { createClient as createSbClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function ensureEnv() {
  const needed = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const
  const missing = needed.filter(k => !process.env[k])
  if (missing.length === 0) return
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2]
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
  const stillMissing = needed.filter(k => !process.env[k])
  if (stillMissing.length) throw new Error(`Missing env vars: ${stillMissing.join(', ')}`)
}

async function pickTargetUserId(supabase: ReturnType<typeof createSbClient>) {
  if (process.env.SEED_TARGET_USER_ID) return process.env.SEED_TARGET_USER_ID
  const preferredRoles = ['site_manager', 'worker']
  const { data: firstPreferred } = await supabase
    .from('profiles')
    .select('id, role')
    .in('role', preferredRoles as any)
    .limit(1)
  if (firstPreferred && firstPreferred[0]?.id) return firstPreferred[0].id as string
  const { data: firstProfile } = await supabase.from('profiles').select('id').limit(1)
  if (firstProfile && firstProfile[0]?.id) return firstProfile[0].id as string
  return 'dev-user-001'
}

async function main() {
  ensureEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createSbClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const userId = await pickTargetUserId(supabase)

  const now = new Date()
  const samples = [
    {
      notification_type: 'announcement',
      title: '공지사항',
      body: '시스템 점검 예정: 내일 새벽 2시~4시',
      priority: 'normal',
    },
    {
      notification_type: 'safety_alert',
      title: '안전 알림',
      body: '강풍 예보. 외부 작업 시 안전모/안전벨트 필수 착용',
      priority: 'high',
    },
    {
      notification_type: 'materials',
      title: '자재 입고',
      body: '콘크리트 자재 입고 완료. 수령 확인 바랍니다.',
      priority: 'normal',
    },
    {
      notification_type: 'payroll',
      title: '급여 안내',
      body: '이번 달 급여명세서가 발행되었습니다.',
      priority: 'normal',
    },
    {
      notification_type: 'general',
      title: '일정 변경',
      body: '주간 회의 시간이 내일 오전 9시로 변경되었습니다.',
      priority: 'low',
    },
  ]

  const rows = samples.map(s => ({
    user_id: userId,
    notification_type: s.notification_type,
    title: s.title,
    body: s.body,
    status: 'delivered',
    sent_at: now.toISOString(),
  }))
  // Preflight check
  const check = await supabase.from('notification_logs').select('id').limit(1)
  if (check.error) {
    console.error('Preflight select error:', check.error)
  }

  const { data, error } = await supabase.from('notification_logs').insert(rows).select('id, title')
  if (error) {
    console.error('Insert error object:', error)
    throw new Error('Insert failed: ' + (error as any).message)
  }
  console.log('Seeded notifications for user', userId, data)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
