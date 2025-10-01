/* eslint-disable no-console */
// Seed daily_reports with approved and draft records for quick testing.
// Usage: node scripts/seed-worklogs.js

const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

// Load env (try .env.local, .env.development, .env)
;['.env.local', '.env.development', '.env'].forEach(name => {
  const p = path.join(process.cwd(), name)
  if (fs.existsSync(p)) dotenv.config({ path: p })
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
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

async function main() {
  console.log('Seeding daily_reports (approved + draft)...')

  const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
  const createdBy = anyProfile?.id || null

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .order('created_at', { ascending: false })

  if (sitesError) {
    console.error('Sites query error:', sitesError)
    process.exit(1)
  }

  if (!sites || sites.length === 0) {
    console.log('No sites found. Abort.')
    return
  }

  const memberTypePool = ['슬라브', '거더', '벽체', '기둥', '기초']
  const processPoolApproved = ['균열 보수', '면 보수', '마감 보수', '콘크리트 보수']
  const processPoolDraft = ['균열', '면', '마감', '콘크리트']
  const workTypePool = ['지하', '지상', '지붕', '외부']

  let approvedInserted = 0
  let draftsInserted = 0

  for (const site of sites) {
    const usedDates = new Set()

    // Approved: 3–5개
    const approvedTarget = randInt(3, 5)
    let a = 0
    let attempts = 0
    while (a < approvedTarget && attempts < approvedTarget * 10) {
      attempts++
      const daysBack = randInt(0, 45)
      const d = new Date()
      d.setDate(d.getDate() - daysBack)
      const workDate = d.toISOString().split('T')[0]
      if (usedDates.has(workDate)) continue

      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('site_id', site.id)
        .eq('work_date', workDate)
        .maybeSingle()
      if (existing) continue

      const memberTypes = pickRandom(memberTypePool, randInt(1, 2))
      const processes = pickRandom(processPoolApproved, randInt(1, 2))
      const workTypes = pickRandom(workTypePool, randInt(1, 2))
      const mainManpower = randInt(1, 6)

      const additionalNotes = {
        memberTypes,
        workContents: processes,
        workTypes,
        mainManpower,
        additionalManpower: [],
        notes: `${processes[0]} 작업 진행`,
        safetyNotes: '',
      }

      const location = {
        block: `${String.fromCharCode(65 + randInt(0, 2))}블록`,
        dong: `${randInt(1, 5)}동`,
        unit: `${randInt(1, 10)}층`,
      }

      const payload = {
        site_id: site.id,
        work_date: workDate,
        total_workers: mainManpower,
        work_description: `${site.name || '현장'} - ${processes.join(', ')}`,
        status: 'approved',
        approved_at: new Date().toISOString(),
        additional_notes: additionalNotes,
        location_info: location,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('daily_reports').insert(payload)
      if (insertError) {
        console.error('Insert approved error:', insertError)
        continue
      }

      usedDates.add(workDate)
      a++
      approvedInserted++
    }

    // Drafts: 2–3개
    const draftsTarget = randInt(2, 3)
    let dcount = 0
    attempts = 0
    while (dcount < draftsTarget && attempts < draftsTarget * 10) {
      attempts++
      const daysBack = randInt(0, 30)
      const d = new Date()
      d.setDate(d.getDate() - daysBack)
      const workDate = d.toISOString().split('T')[0]
      if (usedDates.has(workDate)) continue

      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('site_id', site.id)
        .eq('work_date', workDate)
        .maybeSingle()
      if (existing) continue

      const memberTypes = pickRandom(memberTypePool, randInt(1, 2))
      const processes = pickRandom(processPoolDraft, randInt(1, 2))
      const workTypes = pickRandom(workTypePool, randInt(1, 2))
      const mainManpower = randInt(1, 4)

      const workContent = {
        memberTypes,
        workProcesses: processes,
        workTypes,
      }

      const location = {
        block: `${String.fromCharCode(65 + randInt(0, 2))}블록`,
        dong: `${randInt(1, 5)}동`,
        unit: `${randInt(1, 10)}층`,
      }

      const payload = {
        site_id: site.id,
        work_date: workDate,
        total_workers: mainManpower,
        work_description: `${processes[0]} 작업`,
        status: 'draft',
        work_content: workContent,
        location_info: location,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('daily_reports').insert(payload)
      if (insertError) {
        console.error('Insert draft error:', insertError)
        continue
      }

      usedDates.add(workDate)
      dcount++
      draftsInserted++
    }
  }

  console.log('Inserted approved:', approvedInserted, 'drafts:', draftsInserted)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
