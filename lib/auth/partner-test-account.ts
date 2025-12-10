import { createServiceRoleClient } from '@/lib/supabase/service-role'

interface EnsurePartnerTestAccountOptions {
  email: string
  password?: string
  companyName?: string
  fullName?: string
  role?: string
  sitesLimit?: number
}

export interface EnsurePartnerTestAccountResult {
  email: string
  password: string
  userId: string
  partnerCompanyId: string
}

const DEFAULT_COMPANY_NAME = 'INOPNC Partner (테스트)'
const DEFAULT_PASSWORD = 'password123'
const DEFAULT_FULL_NAME = '파트너 관리자'
const DEFAULT_ROLE = 'customer_manager'
const MAX_SITES_LIMIT = 10

const normalizeEmail = (value: string) => value.trim().toLowerCase()

const clampSitesLimit = (value: number) => {
  if (Number.isNaN(value)) return 3
  return Math.min(Math.max(value, 0), MAX_SITES_LIMIT)
}

export async function ensurePartnerTestAccount(
  options: EnsurePartnerTestAccountOptions
): Promise<EnsurePartnerTestAccountResult> {
  if (!options?.email) {
    throw new Error('Email is required')
  }

  const admin = createServiceRoleClient()

  const normalizedEmail = normalizeEmail(options.email)
  const password = (options.password || DEFAULT_PASSWORD).trim()
  const fullName = (options.fullName || DEFAULT_FULL_NAME).trim()
  const role = options.role || DEFAULT_ROLE
  const companyName = (options.companyName || DEFAULT_COMPANY_NAME).trim()
  const sitesLimit = clampSitesLimit(options.sitesLimit ?? 3)
  const nowIso = new Date().toISOString()

  // Ensure partner company exists
  let partnerCompanyId: string | null = null
  {
    const { data: existingCompany, error: companyError } = await admin
      .from('partner_companies')
      .select('id')
      .ilike('company_name', companyName)
      .maybeSingle()

    if (companyError) {
      throw new Error(`Failed to lookup partner company: ${companyError.message}`)
    }

    if (existingCompany?.id) {
      partnerCompanyId = existingCompany.id
    } else {
      const { data: createdCompany, error: createCompanyError } = await admin
        .from('partner_companies')
        .insert({ company_name: companyName, status: 'active' } as any)
        .select('id')
        .single()

      if (createCompanyError || !createdCompany?.id) {
        throw new Error(
          `Failed to create partner company: ${createCompanyError?.message || 'unknown-error'}`
        )
      }
      partnerCompanyId = createdCompany.id
    }
  }

  if (!partnerCompanyId) {
    throw new Error('Unable to resolve partner company id')
  }

  // Create or fetch auth user
  let userId: string | null = null
  {
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })

    if (createUserError && !String(createUserError.message).toLowerCase().includes('already')) {
      throw new Error(`Failed to create user: ${createUserError.message}`)
    }

    if (createdUser?.user?.id) {
      userId = createdUser.user.id
    } else {
      // Locate existing user by email
      let page = 1
      const perPage = 100
      while (!userId) {
        const { data: listResult, error: listError } = await admin.auth.admin.listUsers({
          page,
          perPage,
        })
        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`)
        }
        const users = listResult?.users || []
        const match = users.find(u => normalizeEmail(u.email || '') === normalizedEmail)
        if (match) {
          userId = match.id
          break
        }
        if (users.length < perPage) {
          break
        }
        page += 1
      }
    }
  }

  if (!userId) {
    throw new Error('Could not resolve user id')
  }

  // Ensure password + metadata are up to date
  try {
    await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    })
  } catch (error: any) {
    throw new Error(`Failed to reset user password: ${error?.message || error}`)
  }

  // Upsert profile
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      role,
      partner_company_id: partnerCompanyId,
      status: 'active',
      updated_at: nowIso,
    } as any,
    { onConflict: 'id' }
  )

  if (profileError) {
    throw new Error(`Failed to upsert profile: ${profileError.message}`)
  }

  // Ensure partner to site mappings exist (best-effort)
  const { data: mappings } = await admin
    .from('partner_site_mappings')
    .select('site_id')
    .eq('partner_company_id', partnerCompanyId)
    .limit(1)

  if (!mappings || mappings.length === 0) {
    const { data: sites } = await admin
      .from('sites')
      .select('id, status')
      .in('status', ['active', 'in_progress'])
      .limit(sitesLimit)

    if (sites && sites.length > 0) {
      const rows = sites.map(site => ({
        partner_company_id: partnerCompanyId,
        site_id: site.id,
        is_active: true,
        start_date: nowIso.split('T')[0],
        notes: JSON.stringify({ created_by: 'ensurePartnerTestAccount' }),
      }))

      try {
        await admin.from('partner_site_mappings').insert(rows as any)
      } catch (error) {
        console.warn('[ensurePartnerTestAccount] Failed to insert partner_site_mappings:', error)
      }
    }
  }

  return {
    email: normalizedEmail,
    password,
    userId,
    partnerCompanyId,
  }
}
