/**
 * Lists partner/customer_manager users whose partner_company_id is missing.
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ts-node scripts/check-missing-partner-company.ts
 */
import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    ''

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id, partner_company_id')
    .in('role', ['partner', 'customer_manager'])
    .is('partner_company_id', null)

  if (error) {
    throw error
  }

  const rows = data || []
  console.log(`Missing partner_company_id: ${rows.length} user(s)`)
  rows.forEach(row => {
    console.log(
      `${row.id} | ${row.email || '-'} | ${row.full_name || '-'} | role=${row.role} | org=${
        row.organization_id || '-'
      }`
    )
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
