#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
let dotenv
try {
  dotenv = require('dotenv')
} catch (err) {
  // dotenv is optional for this script; proceed without it
  dotenv = undefined
}

async function main() {
  // Load env from common files if available
  if (dotenv) {
    ;['.env.local', '.env.development', '.env'].forEach(name => {
      const p = path.join(process.cwd(), name)
      if (fs.existsSync(p)) dotenv.config({ path: p })
    })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const results = { ok: true, details: {} }

  // 1) site_assignment_gaps sample
  try {
    const {
      data: gaps,
      error: gapsErr,
      count: gapsCount,
    } = await supabase.from('site_assignment_gaps').select('*', { count: 'exact' }).limit(20)
    if (gapsErr) throw gapsErr
    results.details.site_assignment_gaps = {
      total: gapsCount ?? 0,
      sample: gaps || [],
    }
  } catch (e) {
    results.ok = false
    results.details.site_assignment_gaps = { error: e.message || String(e) }
  }

  // 2) is_active null count
  try {
    const { count, error } = await supabase
      .from('site_assignments')
      .select('id', { count: 'exact', head: true })
      .is('is_active', null)
    if (error) throw error
    results.details.is_active_null_count = count ?? 0
  } catch (e) {
    results.ok = false
    results.details.is_active_null_count = { error: e.message || String(e) }
  }

  // 3) active duplicates (client-side aggregation to avoid SQL specifics)
  try {
    const pageSize = 1000
    let from = 0
    let to = from + pageSize - 1
    const counts = new Map()
    let totalFetched = 0
    while (true) {
      const { data, error } = await supabase
        .from('site_assignments')
        .select('site_id,user_id', { head: false })
        .eq('is_active', true)
        .range(from, to)
      if (error) throw error
      const rows = data || []
      for (const r of rows) {
        const key = `${r.site_id}|${r.user_id}`
        counts.set(key, (counts.get(key) || 0) + 1)
      }
      totalFetched += rows.length
      if (rows.length < pageSize) break
      from += pageSize
      to += pageSize
    }
    const duplicates = []
    for (const [key, cnt] of counts.entries()) {
      if (cnt > 1) {
        const [site_id, user_id] = key.split('|')
        duplicates.push({ site_id, user_id, cnt })
      }
    }
    results.details.active_duplicates = {
      total: duplicates.length,
      sample: duplicates.slice(0, 20),
      scanned: totalFetched,
    }
  } catch (e) {
    results.ok = false
    results.details.active_duplicates = { error: e.message || String(e) }
  }

  // 4) work_records user_id null but profile_id present
  try {
    const { count, error } = await supabase
      .from('work_records')
      .select('id', { count: 'exact', head: true })
      .is('user_id', null)
      .not('profile_id', 'is', null)
    if (error) throw error
    results.details.work_records_user_id_null_with_profile = count ?? 0
  } catch (e) {
    results.ok = false
    results.details.work_records_user_id_null_with_profile = { error: e.message || String(e) }
  }

  // Output summary
  console.log('\n=== Data Integrity Verification ===')
  console.log('- site_assignment_gaps total:', results.details.site_assignment_gaps?.total)
  if ((results.details.site_assignment_gaps?.sample || []).length > 0) {
    console.log('  sample (first up to 20):')
    console.table(results.details.site_assignment_gaps.sample)
  }
  console.log('- site_assignments is_active NULL count:', results.details.is_active_null_count)
  console.log('- active duplicates total:', results.details.active_duplicates?.total)
  if ((results.details.active_duplicates?.sample || []).length > 0) {
    console.log('  sample duplicates (first up to 20):')
    console.table(results.details.active_duplicates.sample)
  }
  console.log(
    '- work_records user_id NULL with profile_id present count:',
    results.details.work_records_user_id_null_with_profile
  )

  // Exit code
  if (!results.ok) {
    console.error('\nOne or more checks failed. See details above.')
    process.exit(2)
  }
}

main().catch(err => {
  console.error('Verification script error:', err)
  process.exit(1)
})
