/*
  Sync organizations into partner_companies so that DepartmentSelect can list them.

  - Reads organizations.name (active only if column is_active exists; otherwise all)
  - Upserts missing rows into partner_companies with:
      company_name=name, company_type='construction', status='active'

  Usage:
    npm run sync:org-to-partner

  Env:
    NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/
/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Load organizations
  let orgs: Array<{ name: string }> = []
  try {
    const { data, error } = await supabase.from('organizations').select('name')
    if (error) throw error
    orgs = (data || []).map((r: any) => ({ name: String(r?.name || '').trim() })).filter(o => !!o.name)
  } catch (e: any) {
    console.error('Failed to read organizations:', e?.message || e)
    process.exit(1)
  }
  if (orgs.length === 0) {
    console.log('No organizations found')
    return
  }

  const names = Array.from(new Set(orgs.map(o => o.name)))
  // Load existing partner companies by names
  const { data: existing } = await supabase.from('partner_companies').select('company_name').in('company_name', names)
  const existingSet = new Set((existing || []).map((r: any) => String(r?.company_name || '').trim()))

  const missing = names.filter(n => !existingSet.has(n))
  if (missing.length === 0) {
    console.log('All organizations already present in partner_companies')
    return
  }

  const rows = missing.map(name => ({ company_name: name, status: 'active' }))
  const { error: insErr } = await supabase.from('partner_companies').insert(rows as any)
  if (insErr) {
    console.error('Insert partner_companies failed:', insErr.message)
    process.exit(1)
  }
  console.log(`Inserted ${rows.length} partner_companies from organizations`)
}

main().catch(err => {
  console.error('[sync-org-to-partner] failed:', err?.message || err)
  process.exit(1)
})
