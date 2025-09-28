/* eslint-disable no-console */
// Fills missing work content on existing draft daily_reports and
// seeds approved reports per site (2–5 each).
// Usage: node scripts/fix-and-seed-daily-reports.js

const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

// Load env files in priority order
;['.env.local', '.env.development', '.env'].forEach(name => {
  const p = path.join(process.cwd(), name)
  if (fs.existsSync(p)) dotenv.config({ path: p })
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '[fix-and-seed] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(arr, count) {
  const copy = [...arr]
  const out = []
  while (copy.length && out.length < count) {
    const idx = randInt(0, copy.length - 1)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

async function fillDrafts() {
  console.log('[fix-and-seed] Filling missing fields for draft daily_reports...')
  const memberTypePool = ['슬라브', '거더', '벽체', '기둥', '기초']
  const processPool = ['균열', '면', '마감', '콘크리트']
  const sectionPool = ['지하 1층', '지하 2층', '1층', '2층', '옥상', '외부']

  // Fetch drafts with missing work_content or work_description
  const { data: drafts, error } = await supabase
    .from('daily_reports')
    .select(
      'id, member_name, process_type, work_process, work_section, component_name, issues, total_workers'
    )
    .eq('status', 'draft')
    .or(
      [
        'member_name.is.null',
        'member_name.eq.',
        'process_type.is.null',
        'process_type.eq.',
        'work_process.is.null',
        'work_process.eq.',
        'work_section.is.null',
        'work_section.eq.',
        'component_name.is.null',
        'component_name.eq.',
        'issues.is.null',
        'issues.eq.',
      ].join(',')
    )

  if (error) {
    console.error('[fix-and-seed] Query drafts error:', error)
    process.exit(1)
  }

  if (!drafts || drafts.length === 0) {
    console.log('[fix-and-seed] No drafts with missing content found.')
    return { updated: 0 }
  }

  let updated = 0
  for (const dr of drafts) {
    const member =
      dr.member_name && dr.member_name.trim() !== ''
        ? dr.member_name
        : pickRandom(memberTypePool, 1)[0]
    const proc =
      dr.process_type && dr.process_type.trim() !== ''
        ? dr.process_type
        : pickRandom(processPool, 1)[0]
    const workProc = dr.work_process && dr.work_process.trim() !== '' ? dr.work_process : proc
    const section =
      dr.work_section && dr.work_section.trim() !== ''
        ? dr.work_section
        : pickRandom(sectionPool, 1)[0]
    const component =
      dr.component_name && dr.component_name.trim() !== '' ? dr.component_name : '기타'
    const issues = dr.issues && String(dr.issues).trim() !== '' ? dr.issues : `${proc} 작업 진행`
    const newTotalWorkers =
      dr.total_workers && dr.total_workers > 0 ? dr.total_workers : randInt(1, 4)

    const payload = {
      member_name: member,
      process_type: proc,
      work_process: workProc,
      work_section: section,
      component_name: component,
      issues,
      total_workers: newTotalWorkers,
      updated_at: new Date().toISOString(),
    }

    const { error: updErr } = await supabase.from('daily_reports').update(payload).eq('id', dr.id)
    if (updErr) {
      console.error('[fix-and-seed] Update error for id', dr.id, updErr)
      continue
    }
    updated += 1
  }

  console.log('[fix-and-seed] Updated drafts:', updated)
  return { updated }
}

async function seedApprovedPerSite() {
  console.log('[fix-and-seed] Seeding submitted (approved) reports (2–5 per site)...')
  const memberTypePool = ['슬라브', '거더', '벽체', '기둥', '기초']
  const processPool = ['균열 보수', '면 보수', '마감 보수', '콘크리트 보수']
  const sectionPool = ['지하 1층', '지하 2층', '1층', '2층', '옥상', '외부']

  const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
  const createdBy = anyProfile?.id || null

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .order('created_at', { ascending: false })

  if (sitesError) {
    console.error('[fix-and-seed] Sites query error:', sitesError)
    process.exit(1)
  }
  if (!sites || sites.length === 0) {
    console.log('[fix-and-seed] No sites found; skipping approved seeding.')
    return { inserted: 0, perSite: {} }
  }

  let totalInserted = 0
  const perSite = {}
  for (const site of sites) {
    const usedDates = new Set()
    const target = randInt(2, 5)
    let inserted = 0
    let attempts = 0

    while (inserted < target && attempts < target * 10) {
      attempts++
      const daysBack = randInt(0, 45)
      const d = new Date()
      d.setDate(d.getDate() - daysBack)
      const workDate = d.toISOString().split('T')[0]
      if (usedDates.has(workDate)) continue

      // Avoid duplicate for same site-date
      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('site_id', site.id)
        .eq('work_date', workDate)
        .maybeSingle()
      if (existing) continue

      const member = pickRandom(memberTypePool, 1)[0]
      const proc = pickRandom(processPool, 1)[0]
      const section = pickRandom(sectionPool, 1)[0]
      const mainManpower = randInt(1, 6)

      const payload = {
        site_id: site.id,
        work_date: workDate,
        total_workers: mainManpower,
        member_name: member,
        process_type: proc,
        work_process: proc.replace(' 보수', ''),
        work_section: section,
        component_name: '기타',
        issues: `${proc} 작업 진행`,
        status: 'submitted',
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('daily_reports').insert(payload)
      if (insertError) {
        console.error('[fix-and-seed] Insert approved error:', insertError)
        // Bail out fast if DB has triggers requiring columns that don't exist in this environment
        const msg = String(insertError?.message || '')
        if (
          msg.includes('action_url') ||
          msg.includes('approved_at') ||
          insertError?.code === '42703'
        ) {
          return { inserted: totalInserted, perSite }
        }
        continue
      }

      usedDates.add(workDate)
      inserted++
      totalInserted++
    }

    perSite[site.id] = inserted
  }

  console.log('[fix-and-seed] Inserted approved total:', totalInserted)
  return { inserted: totalInserted, perSite }
}

async function promoteDraftsToSubmitted() {
  console.log('[fix-and-seed] Promoting existing drafts to submitted (2–5 per site)...')
  const memberTypePool = ['슬라브', '거더', '벽체', '기둥', '기초']
  const processPool = ['균열', '면', '마감', '콘크리트']
  const sectionPool = ['지하 1층', '지하 2층', '1층', '2층', '옥상', '외부']

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .order('created_at', { ascending: false })

  if (sitesError) {
    console.error('[fix-and-seed] Sites query error:', sitesError)
    return { promoted: 0, perSite: {} }
  }

  let totalPromoted = 0
  const perSite = {}
  for (const site of sites || []) {
    const target = randInt(2, 5)
    // Fetch up to 10 recent drafts for this site
    const { data: drafts, error } = await supabase
      .from('daily_reports')
      .select(
        'id, member_name, process_type, work_process, work_section, component_name, issues, total_workers'
      )
      .eq('site_id', site.id)
      .eq('status', 'draft')
      .order('work_date', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[fix-and-seed] Fetch drafts per site error:', error)
      continue
    }
    if (!drafts || drafts.length === 0) {
      perSite[site.id] = 0
      continue
    }

    const chosen = pickRandom(drafts, Math.min(target, drafts.length))
    let promotedForSite = 0
    for (const dr of chosen) {
      const member =
        dr.member_name && dr.member_name.trim() !== ''
          ? dr.member_name
          : pickRandom(memberTypePool, 1)[0]
      const proc =
        dr.process_type && dr.process_type.trim() !== ''
          ? dr.process_type
          : pickRandom(processPool, 1)[0]
      const workProc = dr.work_process && dr.work_process.trim() !== '' ? dr.work_process : proc
      const section =
        dr.work_section && dr.work_section.trim() !== ''
          ? dr.work_section
          : pickRandom(sectionPool, 1)[0]
      const component =
        dr.component_name && dr.component_name.trim() !== '' ? dr.component_name : '기타'
      const issues = dr.issues && String(dr.issues).trim() !== '' ? dr.issues : `${proc} 작업 진행`
      const totalWorkers =
        dr.total_workers && dr.total_workers > 0 ? dr.total_workers : randInt(1, 6)

      const { error: updErr } = await supabase
        .from('daily_reports')
        .update({
          status: 'submitted',
          member_name: member,
          process_type: proc,
          work_process: workProc,
          work_section: section,
          component_name: component,
          issues,
          total_workers: totalWorkers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dr.id)

      if (updErr) {
        console.error('[fix-and-seed] Promote draft error:', updErr)
        continue
      }
      promotedForSite++
      totalPromoted++
    }
    perSite[site.id] = promotedForSite
  }

  console.log('[fix-and-seed] Promoted drafts total:', totalPromoted)
  return { promoted: totalPromoted, perSite }
}

async function main() {
  const draftResult = await fillDrafts()
  // Try insert new submitted reports first (may fail due to DB triggers on some environments)
  let approvedInserted = 0
  try {
    const approvedResult = await seedApprovedPerSite()
    approvedInserted = approvedResult.inserted
  } catch (e) {
    console.warn(
      '[fix-and-seed] Seeding approved failed; will try converting drafts per site instead.'
    )
  }
  if (approvedInserted === 0) {
    const promoted = await promoteDraftsToSubmitted()
    approvedInserted = promoted.promoted
  }
  console.log('[fix-and-seed] Done.', { draftsUpdated: draftResult.updated, approvedInserted })
}

main().catch(err => {
  console.error('[fix-and-seed] Fatal error:', err)
  process.exit(1)
})
