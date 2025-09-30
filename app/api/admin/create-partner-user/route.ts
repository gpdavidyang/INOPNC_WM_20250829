import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase env (URL or service role key)' },
        { status: 500 }
      )
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await request.json().catch(() => ({}))
    const email = body?.email || 'partner@inopnc.com'
    const password = body?.password || 'password123'
    const companyName = body?.company_name || 'INOPNC Partner (테스트)'
    const limit = Math.min(Math.max(Number(body?.sites_limit || 3), 0), 10)

    // Ensure partner company
    const { data: existingCompany } = await admin
      .from('partner_companies')
      .select('id, company_name')
      .ilike('company_name', companyName)
      .maybeSingle()

    let partnerCompanyId = existingCompany?.id || null
    if (!partnerCompanyId) {
      const { data: company, error: createCompanyError } = await admin
        .from('partner_companies')
        .insert({ company_name: companyName, status: 'active' } as any)
        .select('id')
        .single()

      if (createCompanyError) {
        return NextResponse.json(
          { error: 'Failed to create partner company', details: createCompanyError.message },
          { status: 500 }
        )
      }
      partnerCompanyId = company!.id
    }

    // Create or get auth user
    let userId: string | null = null
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: '파트너 관리자', role: 'customer_manager' },
    })

    if (createUserError && !String(createUserError.message).toLowerCase().includes('already')) {
      // Try to locate existing user
      const { data: list } = await admin.auth.admin.listUsers()
      const match = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (!match) {
        return NextResponse.json(
          { error: 'Failed to create user', details: createUserError.message },
          { status: 500 }
        )
      }
      userId = match.id
    } else {
      userId = createdUser?.user?.id || null
      if (!userId) {
        const { data: list } = await admin.auth.admin.listUsers()
        const match = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        userId = match?.id || null
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve user id' }, { status: 500 })
    }

    // Reset password to requested value (idempotent)
    try {
      await admin.auth.admin.updateUserById(userId, { password })
    } catch (e: any) {
      console.warn('[create-partner-user] password reset failed:', e?.message || e)
    }

    // Upsert profile
    const { error: upsertErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: '파트너 관리자',
        role: 'customer_manager',
        partner_company_id: partnerCompanyId,
        status: 'active',
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'id' }
    )

    if (upsertErr) {
      return NextResponse.json(
        { error: 'Failed to upsert profile', details: upsertErr.message },
        { status: 500 }
      )
    }

    // Map sites if no mappings
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
        .limit(limit)

      const rows = (sites || []).map(s => ({
        partner_company_id: partnerCompanyId,
        site_id: s.id,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        notes: JSON.stringify({ created_by: 'api/admin/create-partner-user' }),
      }))
      if (rows.length > 0) {
        await admin.from('partner_site_mappings').insert(rows as any)
      }
    }

    return NextResponse.json({
      success: true,
      user: { email },
      partner_company_id: partnerCompanyId,
    })
  } catch (error) {
    console.error('[create-partner-user] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
