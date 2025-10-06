/*
  Cleanup script: backup and permanently delete inactive work options

  Usage:
    - Dry run (no delete):  npx tsx scripts/cleanup-inactive-work-options.ts --dry-run
    - Execute delete:       npx tsx scripts/cleanup-inactive-work-options.ts

  Requirements:
    - Env vars:
      NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
      SUPABASE_SERVICE_ROLE_KEY (service role key)
*/

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function getEnv(name: string) {
  return process.env[name]
}

async function main() {
  const DRY_RUN = process.argv.includes('--dry') || process.argv.includes('--dry-run')
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL') || ''
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!supabaseUrl || !serviceKey) {
    console.error(
      '[cleanup] Missing Supabase env. NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(`[cleanup] Fetching inactive work options…`)
  const { data: inactive, error } = await supabase
    .from('work_option_settings')
    .select('*')
    .eq('is_active', false)
    .order('option_type', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[cleanup] Failed to fetch inactive options:', error.message)
    process.exit(1)
  }

  const count = inactive?.length || 0
  if (count === 0) {
    console.log('[cleanup] No inactive rows found. Nothing to do.')
    return
  }

  // Write backup
  const ts = new Date()
  const stamp =
    ts.getFullYear().toString() +
    String(ts.getMonth() + 1).padStart(2, '0') +
    String(ts.getDate()).padStart(2, '0') +
    '_' +
    String(ts.getHours()).padStart(2, '0') +
    String(ts.getMinutes()).padStart(2, '0') +
    String(ts.getSeconds()).padStart(2, '0')

  const outDir = path.join(process.cwd(), 'backup', 'work_option_settings')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `inactive_backup_${stamp}.json`)

  const payload = {
    meta: {
      generatedAt: ts.toISOString(),
      total: count,
      table: 'work_option_settings',
      filter: { is_active: false },
    },
    rows: inactive,
  }

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8')
  console.log(
    `[cleanup] Backup written: ${path.relative(process.cwd(), outPath)} (${count} rows)${DRY_RUN ? ' [dry]' : ''}`
  )

  if (DRY_RUN) {
    console.log('[cleanup] Dry-run mode; skip delete.')
    return
  }

  console.log('[cleanup] Deleting inactive rows…')
  const { data: deleted, error: delErr } = await supabase
    .from('work_option_settings')
    .delete()
    .eq('is_active', false)
    .select('*')

  if (delErr) {
    console.error('[cleanup] Delete failed:', delErr.message)
    process.exit(1)
  }

  console.log(`[cleanup] Deleted ${deleted?.length || 0} rows. Done.`)
}

main().catch(err => {
  console.error('[cleanup] Unexpected error:', err)
  process.exit(1)
})
