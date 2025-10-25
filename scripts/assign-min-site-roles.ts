/*
  Ensure each site has at least 1 worker and 1 site_manager assigned.

  Behavior:
    - Scans active assignments in site_assignments
    - If a site lacks a 'worker' or a 'site_manager', assigns one randomly
    - Uses service-role client; no RLS blockers

  Usage:
    npx -y tsx scripts/assign-min-site-roles.ts [--dry-run]

  Notes:
    - If there is no available profile for a role, the site is skipped for that role
*/
/* eslint-disable no-console */
import 'dotenv/config'
import process from 'node:process'
import { createServiceClient } from '@/lib/supabase/service'

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue
    const [k, v] = a.replace(/^--/, '').split('=')
    args[k] = v === undefined ? true : v
  }
  const dryRun = Boolean(args['dry-run'] || args.dry || false)
  return { dryRun }
}

function pickCycle<T>(arr: T[], idx: number): T | null {
  if (!arr.length) return null
  return arr[idx % arr.length]
}

async function main() {
  const { dryRun } = parseArgs(process.argv)
  const db = createServiceClient()

  // Load sites
  const { data: sites, error: sitesErr } = await db.from('sites').select('id, name')

  if (sitesErr) throw sitesErr
  const siteList = sites || []

  // Load active assignments
  const { data: assigns, error: assignErr } = await db
    .from('site_assignments')
    .select('site_id, user_id, role, is_active')
    .eq('is_active', true)

  if (assignErr) throw assignErr

  const bySite: Record<string, { worker: boolean; site_manager: boolean }> = {}
  for (const s of siteList) bySite[s.id] = { worker: false, site_manager: false }
  for (const a of assigns || []) {
    if (!bySite[a.site_id]) continue
    if (a.role === 'worker') bySite[a.site_id].worker = true
    if (a.role === 'site_manager') bySite[a.site_id].site_manager = true
  }

  // Candidate pools
  const { data: workers, error: workersErr } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'worker')
    .eq('status', 'active')
  if (workersErr) throw workersErr

  const { data: managers, error: managersErr } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'site_manager')
    .eq('status', 'active')
  if (managersErr) throw managersErr

  let wIdx = 0
  let mIdx = 0
  let toInsert: Array<{ site_id: string; user_id: string; role: 'worker' | 'site_manager' }> = []

  for (const s of siteList) {
    const state = bySite[s.id] || { worker: false, site_manager: false }
    if (!state.worker) {
      const w = pickCycle(workers || [], wIdx++) as any
      if (w?.id) toInsert.push({ site_id: s.id, user_id: w.id, role: 'worker' })
    }
    if (!state.site_manager) {
      const m = pickCycle(managers || [], mIdx++) as any
      if (m?.id) toInsert.push({ site_id: s.id, user_id: m.id, role: 'site_manager' })
    }
  }

  console.log(
    `Planned assignments: ${toInsert.length} (sites: ${siteList.length}, missing worker: ${Object.values(bySite).filter(v => !v.worker).length}, missing manager: ${Object.values(bySite).filter(v => !v.site_manager).length})`
  )

  if (dryRun) {
    console.log('Dry-run: showing first 10 rows')
    console.table(toInsert.slice(0, 10))
    return
  }

  let inserted = 0
  for (const row of toInsert) {
    const { error } = await db.from('site_assignments').insert({
      site_id: row.site_id,
      user_id: row.user_id,
      role: row.role,
      assigned_date: new Date().toISOString(),
      is_active: true,
    })
    if (error) {
      console.error('Insert failed:', row, error)
      continue
    }
    inserted++
    if (inserted % 50 === 0) console.log(`Inserted ${inserted} assignments...`)
  }

  console.log(`Done. Inserted ${inserted} assignments.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
