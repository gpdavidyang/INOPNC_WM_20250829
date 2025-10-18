/**
 * Seed production history data for September and October
 * for materials NPC-1000 and NPC-9000, ensuring referential integrity.
 *
 * - Ensures materials exist (creates if missing)
 * - Ensures at least one site exists (creates a demo site if none found)
 * - Inserts idempotent material_productions rows across the two months
 */

import fs from 'node:fs'
import path from 'node:path'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type UUID = string

function loadEnvFallback() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const candidates = ['.env.local', '.env', '.env.development.local', '.env.development']
  for (const file of candidates) {
    const p = path.resolve(process.cwd(), file)
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8')
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
        if (!process.env[key]) process.env[key] = value
      }
      break
    }
  }
}

async function ensureMaterial(code: string, name: string) {
  const supabase = createServiceRoleClient()
  const { data: existing, error: selErr } = await supabase
    .from('materials')
    .select('id')
    .ilike('code', code)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing?.id) return existing.id as UUID

  const { data: inserted, error: insErr } = await supabase
    .from('materials')
    .insert({
      name,
      code,
      category: 'NPC',
      unit: 'EA',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (insErr) throw insErr
  return inserted!.id as UUID
}

async function ensureSites(minCount = 1): Promise<UUID[]> {
  const supabase = createServiceRoleClient()
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id')
    .eq('is_deleted', false)
    .limit(10)
  if (error) throw error
  if (sites && sites.length >= minCount) return sites.map(s => s.id as UUID)

  // Create a demo site if none exist
  const { data: newSite, error: insErr } = await supabase
    .from('sites')
    .insert({
      name: '데모 현장 A',
      address: '서울특별시 강남구 데모로 1',
      start_date: new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)).toISOString(),
      status: 'active',
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (insErr) throw insErr
  return [newSite!.id as UUID]
}

function makeDatesForMonth(year: number, monthIndex0: number): string[] {
  // Use a few representative days in the month to avoid flooding
  const days = [1, 5, 10, 15, 20, 25]
  return days.map(d => new Date(Date.UTC(year, monthIndex0, d)).toISOString().slice(0, 10))
}

async function getAnyCreatorId(): Promise<string | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .in('role', ['admin', 'system_admin', 'production_manager'])
    .limit(1)
  if (error) return null
  return data && data.length > 0 ? (data[0].id as string) : null
}

async function insertProductionIfMissing(params: {
  site_id: UUID
  material_id: UUID
  production_date: string // YYYY-MM-DD
  produced_quantity: number
  created_by?: string | null
}) {
  const supabase = createServiceRoleClient()
  const { data: exists, error: selErr } = await supabase
    .from('material_productions')
    .select('id')
    .eq('site_id', params.site_id)
    .eq('material_id', params.material_id)
    .eq('production_date', params.production_date)
    .limit(1)
  if (selErr) throw selErr
  if (exists && exists.length > 0) return

  const base: any = {
    site_id: params.site_id,
    material_id: params.material_id,
    production_date: params.production_date,
    produced_quantity: params.produced_quantity,
    production_number: genProductionNumber(params.production_date),
    quality_status: 'approved',
  }
  // Avoid inserting columns that may not exist in the current schema

  const { error: insErr } = await supabase.from('material_productions').insert(base)
  if (insErr) throw insErr
}

function genProductionNumber(date: string): string {
  const yyyymmdd = date.replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PROD-${yyyymmdd}-${rand}`
}

async function main() {
  loadEnvFallback()
  const supabase = createServiceRoleClient()
  // Quick sanity check
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env not loaded')
  }

  const [mat1000, mat9000] = await Promise.all([
    ensureMaterial('NPC-1000', 'NPC-1000'),
    ensureMaterial('NPC-9000', 'NPC-9000'),
  ])
  const siteIds = await ensureSites(1)
  const creatorId = await getAnyCreatorId()

  const year = new Date().getUTCFullYear()
  const septDates = makeDatesForMonth(year, 8) // September (0-based)
  const octDates = makeDatesForMonth(year, 9) // October

  const jobs: Array<Promise<void>> = []

  function qtyFor(code: 'NPC-1000' | 'NPC-9000', dayIndex: number) {
    // Simple patterned quantities
    if (code === 'NPC-1000') return 500 + (dayIndex % 3) * 250 // 500, 750, 1000
    return 200 + (dayIndex % 2) * 150 // 200, 350
  }

  let idx = 0
  for (const date of [...septDates, ...octDates]) {
    for (const siteId of siteIds) {
      jobs.push(
        insertProductionIfMissing({
          site_id: siteId,
          material_id: mat1000,
          production_date: date,
          produced_quantity: qtyFor('NPC-1000', idx++),
          created_by: creatorId,
        })
      )
      jobs.push(
        insertProductionIfMissing({
          site_id: siteId,
          material_id: mat9000,
          production_date: date,
          produced_quantity: qtyFor('NPC-9000', idx++),
          created_by: creatorId,
        })
      )
    }
  }

  // Run with limited concurrency
  for (const chunk of chunkArray(jobs, 5)) {
    await Promise.all(chunk)
  }

  // Output summary
  const { count: countProd } = await supabase
    .from('material_productions')
    .select('id', { count: 'exact', head: true })
  console.log('✅ Seeding complete. Total production records:', countProd)
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
