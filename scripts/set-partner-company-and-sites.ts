/**
 * Sets partner_company_id for a user (by email) and links sites to that partner in partner_site_mappings.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   PARTNER_EMAIL=<user email> (required)
 *   PARTNER_COMPANY_ID=<partner_company_id> (required)
 *   SITE_IDS=<comma-separated site ids> (optional, to create mappings)
 *
 * Example:
 *   PARTNER_EMAIL=partner@inopnc.com PARTNER_COMPANY_ID=uuid SITE_IDS=site1,site2 \
 *   ts-node scripts/set-partner-company-and-sites.ts
 */
import { createClient } from '@supabase/supabase-js'

function env(name: string): string {
  const v = process.env[name] || ''
  if (!v.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return v.trim()
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    ''
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

  const email = env('PARTNER_EMAIL').toLowerCase()
  const partnerCompanyId = env('PARTNER_COMPANY_ID')
  const siteIdsRaw = (process.env.SITE_IDS || '').trim()
  const siteIds = siteIdsRaw
    ? siteIdsRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : []

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: user, error: userErr } = await supabase
    .from('profiles')
    .select('id, email, partner_company_id, organization_id')
    .ilike('email', email)
    .maybeSingle()

  if (userErr || !user) {
    throw new Error(`User not found for ${email}: ${userErr?.message || ''}`)
  }

  console.log(`Updating user ${user.id} (${user.email}) → partner_company_id=${partnerCompanyId}`)

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ partner_company_id: partnerCompanyId })
    .eq('id', user.id)

  if (updateErr) {
    throw new Error(`Failed to update partner_company_id: ${updateErr.message}`)
  }

  if (siteIds.length > 0) {
    const rows = siteIds.map(id => ({
      site_id: id,
      partner_company_id: partnerCompanyId,
      is_active: true,
      start_date: new Date().toISOString().slice(0, 10),
      notes: null,
    }))
    const { error: mapErr } = await supabase.from('partner_site_mappings').upsert(rows, {
      onConflict: 'site_id,partner_company_id',
    })
    if (mapErr) {
      throw new Error(`Failed to upsert partner_site_mappings: ${mapErr.message}`)
    }
    console.log(`Linked ${siteIds.length} site(s) to partner_company_id=${partnerCompanyId}`)
  } else {
    console.log('No SITE_IDS provided, only updated partner_company_id')
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
