#!/usr/bin/env tsx

/**
 * Creates or updates a partner (customer_manager) user for mobile partner UI.
 * - Email: partner@inopnc.com (override via PARTNER_TEST_EMAIL)
 * - Password: password123 (override via PARTNER_TEST_PASSWORD)
 * - Ensures a partner company exists and maps a few active sites
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const EMAIL = process.env.PARTNER_TEST_EMAIL || 'partner@inopnc.com'
  const PASSWORD = process.env.PARTNER_TEST_PASSWORD || 'password123'
  const COMPANY_NAME = process.env.PARTNER_COMPANY_NAME || 'INOPNC Partner (테스트)'
  const MAX_SITES_TO_MAP = Number(process.env.PARTNER_SITES_LIMIT || '3')

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🔐 Using service role to create partner user...')

  // 1) Ensure partner company
  let partnerCompanyId: string | null = null
  {
    const { data: existing, error: queryErr } = await admin
      .from('partner_companies')
      .select('id, company_name')
      .ilike('company_name', COMPANY_NAME)
      .maybeSingle()

    if (queryErr) {
      console.warn('⚠️ partner_companies query error:', queryErr.message)
    }

    if (existing?.id) {
      partnerCompanyId = existing.id
      console.log('🏢 Found partner company:', existing.company_name, partnerCompanyId)
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from('partner_companies')
        .insert({ company_name: COMPANY_NAME, status: 'active' } as any)
        .select('id, company_name')
        .single()

      if (insertErr) {
        console.error('❌ Failed to create partner company:', insertErr.message)
        process.exit(1)
      }
      partnerCompanyId = inserted!.id
      console.log('🏢 Created partner company:', inserted!.company_name, partnerCompanyId)
    }
  }

  // 2) Create or get auth user
  let userId: string | null = null
  {
    // Attempt to create user; if exists, catch and continue
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: '파트너 관리자', role: 'customer_manager' },
    })

    if (createErr && !String(createErr.message).toLowerCase().includes('user already registered')) {
      console.warn('⚠️ createUser error:', createErr.message)
    }

    if (created?.user?.id) {
      userId = created.user.id
      console.log('👤 Created auth user:', EMAIL, userId)
    }

    if (!userId) {
      // Fallback: paginate through admin users to locate matching email
      let page = 1
      const perPage = 100
      while (!userId) {
        const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({
          page,
          perPage,
        })
        if (listErr) {
          console.error('❌ listUsers error:', listErr.message)
          process.exit(1)
        }
        const users = usersData?.users || []
        const match = users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())
        if (match) {
          userId = match.id
          break
        }
        if (users.length < perPage) {
          break
        }
        page += 1
      }
      if (!userId) {
        console.error('❌ Could not create or find user by email')
        process.exit(1)
      }
      console.log('👤 Existing auth user found:', EMAIL, userId)
      // Ensure password matches desired value
      try {
        await admin.auth.admin.updateUserById(userId, { password: PASSWORD })
        console.log('🔑 Password reset for existing user')
      } catch (e: any) {
        console.warn('⚠️ Password reset failed:', e?.message || e)
      }
    }
  }

  // 3) Upsert profile
  {
    const profile = {
      id: userId,
      email: EMAIL,
      full_name: '파트너 관리자',
      role: 'customer_manager',
      partner_company_id: partnerCompanyId,
      status: 'active',
      updated_at: new Date().toISOString(),
    }
    const { error: upsertErr } = await admin.from('profiles').upsert(profile as any, {
      onConflict: 'id',
    })
    if (upsertErr) {
      console.error('❌ Failed to upsert profile:', upsertErr.message)
      process.exit(1)
    }
    console.log('✅ Profile upserted for', EMAIL)
  }

  // 4) Map partner company to a few active sites (if none yet)
  {
    // Check existing mappings
    const { data: existingMaps } = await admin
      .from('partner_site_mappings')
      .select('site_id')
      .eq('partner_company_id', partnerCompanyId)
      .limit(1)

    if (!existingMaps || existingMaps.length === 0) {
      const { data: activeSites } = await admin
        .from('sites')
        .select('id, name, status')
        .in('status', ['active', 'in_progress'])
        .limit(MAX_SITES_TO_MAP)

      const rows = (activeSites || []).map(s => ({
        partner_company_id: partnerCompanyId,
        site_id: s.id,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        notes: JSON.stringify({ created_by_script: 'create-partner-user.ts' }),
      }))

      if (rows.length > 0) {
        const { error: mapErr } = await admin.from('partner_site_mappings').insert(rows as any)
        if (mapErr) {
          console.warn('⚠️ Failed to insert partner_site_mappings:', mapErr.message)
        } else {
          console.log(`🔗 Mapped ${rows.length} sites to partner company`)
        }
      } else {
        console.log('ℹ️ No active sites found to map. You can add mappings later.')
      }
    } else {
      console.log('🔗 Existing partner_site_mappings found; skipping mapping step')
    }
  }

  console.log('\n🎉 Done! You can now sign in:')
  console.log('   Email   :', EMAIL)
  console.log('   Password:', PASSWORD)
  console.log('   Role    : customer_manager (partner mobile)')
  console.log('\n➡️  Go to /auth/login then you should be redirected to /mobile/partner')
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
