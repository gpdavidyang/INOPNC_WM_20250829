/*
  Import organizations(소속사) and sites(현장) from a CSV/XLSX/TSV file.

  - Input columns (case/locale-insensitive; synonyms supported):
    - organization_name | organization | org | company | 소속사
    - site_name | site | 현장
    - Optional: org_code | organization_code | company_code, site_code | site_external_code

  - Missing attributes (address, status, etc.) are auto-generated:
    - organizations: is_active=true, address/phone/description generated
    - sites: status='active', address generated

  Usage:
    npm run import:org-sites -- --file=./data.csv --mode=upsert --dry-run

  Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY must be set.
*/

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { faker } from '@faker-js/faker'

type Mode = 'insert' | 'upsert'

interface InputRowRaw {
  [key: string]: any
}

interface MappedRow {
  orgName: string
  siteName: string
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue
    const [k, v] = a.replace(/^--/, '').split('=')
    args[k] = v === undefined ? true : v
  }
  const file = String(args.file || args.f || '')
  const mode = (String(args.mode || 'upsert').toLowerCase() as Mode) || 'upsert'
  const dryRun = Boolean(args['dry-run'] || args.dry || false)
  const delimiter = args.delimiter ? String(args.delimiter) : undefined
  return { file, mode, dryRun, delimiter }
}

function readSheet(filePath: string): InputRowRaw[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  const wb = XLSX.readFile(filePath, { raw: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('No sheet found in file')
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<InputRowRaw>(ws, { defval: '' })
  return rows
}

function normalizeKey(k: string): string {
  const s = String(k || '').trim().toLowerCase()
  // strip spaces and special chars
  return s.replace(/\s+/g, '').replace(/[_-]+/g, '')
}

function mapRow(row: InputRowRaw): MappedRow | null {
  const map: Record<string, string> = {}
  for (const key of Object.keys(row)) {
    map[normalizeKey(key)] = key
  }

  const orgKey =
    map['organizationname'] ||
    map['organization'] ||
    map['org'] ||
    map['company'] ||
    map['소속사'] ||
    map['소속사명'] ||
    map['소속']

  const siteKey = map['sitename'] || map['site'] || map['현장'] || map['현장이름'] || map['현장명']

  if (!orgKey || !siteKey) return null

  const orgName = String(row[orgKey] || '').trim()
  const siteName = String(row[siteKey] || '').trim()
  if (!orgName || !siteName) return null
  return { orgName, siteName }
}

async function main() {
  const { file, mode, dryRun } = parseArgs(process.argv)
  if (!file) {
    console.error('Usage: tsx scripts/import-org-sites.ts --file=path/to.csv [--mode=upsert|insert] [--dry-run]')
    process.exit(1)
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || ''
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
    process.exit(1)
  }

  const rowsRaw = readSheet(path.resolve(process.cwd(), file))
  const mapped = rowsRaw
    .map(mapRow)
    .filter((r): r is MappedRow => !!r)
    .map(r => ({
      ...r,
      orgName: r.orgName.trim(),
      siteName: r.siteName.trim(),
    }))

  if (mapped.length === 0) {
    console.error('No valid rows found in file. Ensure headers include organization and site columns.')
    process.exit(1)
  }

  // Deduplicate by orgName + siteName
  const uniqueKey = (r: MappedRow) => `${r.orgName}__${r.siteName}`
  const dedupMap = new Map<string, MappedRow>()
  for (const r of mapped) {
    dedupMap.set(uniqueKey(r), r)
  }
  const input = Array.from(dedupMap.values())

  console.log(`Parsed ${mapped.length} rows; ${input.length} unique org/site pairs`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Resolve organizations
  const byOrgName = new Map<string, string>() // name -> id

  const orgNames = Array.from(new Set(input.map(r => r.orgName)))

  if (orgNames.length > 0) {
    const { data } = await supabase.from('organizations').select('id, name').in('name', orgNames)
    for (const row of data || []) {
      byOrgName.set(String(row.name), String(row.id))
    }
  }

  const newOrgs: { name: string; is_active: boolean; address?: string | null; phone?: string | null; description?: string | null }[] = []
  const plannedOrgNames = new Set<string>()
  for (const r of input) {
    const existingId = byOrgName.get(r.orgName)
    if (!existingId && !plannedOrgNames.has(r.orgName)) {
      newOrgs.push({
        name: r.orgName,
        is_active: true,
        address: faker.location.streetAddress(true),
        phone: faker.phone.number('010-####-####'),
        description: '자동 생성됨',
      })
      plannedOrgNames.add(r.orgName)
    }
  }

  if (newOrgs.length > 0) {
    console.log(`Organizations to insert: ${newOrgs.length}`)
  }

  if (!dryRun && newOrgs.length > 0) {
    const { data, error } = await supabase.from('organizations').insert(newOrgs).select('id, name')
    if (error) throw error
    for (const row of data || []) {
      byOrgName.set(String(row.name), String(row.id))
    }
  }

  // Refresh org name map for any that still missing (in dry-run, simulate ids)
  for (const orgName of orgNames) {
    if (!byOrgName.has(orgName)) {
      byOrgName.set(orgName, `dry_${orgName}`)
    }
  }

  // 2) Resolve existing sites by (name, organization_id)
  // Build organization groups
  const byOrgNameGroups = new Map<string, MappedRow[]>()
  for (const r of input) {
    const arr = byOrgNameGroups.get(r.orgName) || []
    arr.push(r)
    byOrgNameGroups.set(r.orgName, arr)
  }

  const existingSites = new Set<string>() // key: orgId::siteName
  if (!dryRun) {
    // Query per organization to keep IN lists reasonable
    for (const [orgName, rows] of byOrgNameGroups.entries()) {
      const orgId = byOrgName.get(orgName)
      if (!orgId) continue
      const siteNames = Array.from(new Set(rows.map(r => r.siteName)))
      const { data } = await supabase
        .from('sites')
        .select('id, name, organization_id')
        .eq('organization_id', orgId)
        .in('name', siteNames)
      for (const s of data || []) {
        existingSites.add(`${s.organization_id}::${s.name}`)
      }
    }
  }

  // 3) Prepare new sites
  const newSites: { name: string; organization_id: string; address?: string | null; status?: string | null; start_date?: string | null }[] = []
  const plannedSiteKeys = new Set<string>()
  for (const r of input) {
    const orgId = byOrgName.get(r.orgName)
    if (!orgId) continue // in dry-run may be synthetic
    const siteKey = `${orgId}::${r.siteName}`
    if ((existingSites.has(siteKey) || plannedSiteKeys.has(siteKey)) && mode === 'insert') continue
    if ((existingSites.has(siteKey) || plannedSiteKeys.has(siteKey)) && mode === 'upsert') {
      // For upsert, we only insert missing; updates to address/status not required per request
      continue
    }
    newSites.push({
      name: r.siteName,
      organization_id: orgId,
      address: faker.location.streetAddress(true),
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
    } as any)
    plannedSiteKeys.add(siteKey)
  }

  if (newSites.length > 0) {
    console.log(`Sites to insert: ${newSites.length}`)
  }

  if (!dryRun && newSites.length > 0) {
    const { error } = await supabase.from('sites').insert(newSites)
    if (error) throw error
  }

  console.log('Done.', dryRun ? '(dry-run only: no changes written)' : '')
}

main().catch(err => {
  console.error('[import-org-sites] Failed:', err?.message || err)
  process.exit(1)
})
