/*
  Create explicit partner_site_mappings by matching partner_companies to organizations by name,
  then linking all sites under those organizations to the partner.

  Steps:
    1) Load partner_companies (active preferred)
    2) For each partner, find organizations with same name (strict first, then ilike)
    3) Load sites by organization_id
    4) Insert missing rows into partner_site_mappings (partner_company_id, site_id)

  Usage:
    npm run sync:partner-sites

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

  // 1) Load partners
  const { data: partners, error: pErr } = await supabase
    .from('partner_companies')
    .select('id, company_name, status')
    .order('company_name', { ascending: true })
  if (pErr) throw pErr
  const partnerRows = (partners || []).map(p => ({
    id: String((p as any).id),
    name: String((p as any).company_name || '').trim(),
    status: String((p as any).status || ''),
  }))

  if (partnerRows.length === 0) {
    console.log('No partner_companies rows found; aborting')
    return
  }

  let totalInserted = 0
  for (const partner of partnerRows) {
    if (!partner.name) continue

    // 2) Find matching organizations by name (strict → ilike fallback)
    const { data: orgStrict } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', partner.name)
    let orgIds: string[] = Array.isArray(orgStrict) ? orgStrict.map(r => String((r as any).id)) : []
    if (orgIds.length === 0) {
      const { data: orgLike } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', partner.name)
      orgIds = Array.isArray(orgLike) ? orgLike.map(r => String((r as any).id)) : []
    }
    if (orgIds.length === 0) continue

    // 3) Load sites for those organizations
    const { data: sites } = await supabase
      .from('sites')
      .select('id, organization_id')
      .in('organization_id', orgIds)
    const siteIds = Array.isArray(sites) ? sites.map(s => String((s as any).id)) : []
    if (siteIds.length === 0) continue

    // 4) Load existing mappings for this partner
    const { data: existing } = await supabase
      .from('partner_site_mappings')
      .select('site_id')
      .eq('partner_company_id', partner.id)
    const existingSet = new Set((existing || []).map(r => String((r as any).site_id)))

    // Compute missing
    const missingSiteIds = siteIds.filter(id => !existingSet.has(id))
    if (missingSiteIds.length === 0) continue

    const rows = missingSiteIds.map(site_id => ({ partner_company_id: partner.id, site_id }))
    const { error: insErr } = await supabase.from('partner_site_mappings').insert(rows as any)
    if (insErr) {
      console.error('Insert partner_site_mappings failed for partner', partner.id, insErr.message)
      continue
    }
    totalInserted += rows.length
    console.log(`✓ Partner ${partner.name} mapped ${rows.length} sites`)
  }

  console.log(`Done. Inserted total mappings: ${totalInserted}`)
}

main().catch(err => {
  console.error('[sync-partner-site-mappings] failed:', err?.message || err)
  process.exit(1)
})

