import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// DEV ONLY: 시공업체(organizations) 소속의 본사관리자 계정 생성
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
    const email = String(body?.email || 'company-admin@inopnc.com').toLowerCase()
    const password = String(body?.password || 'password123')
    const orgName = String(body?.organization_name || 'INOPNC Construction (테스트)')

    // Ensure organization
    const { data: existingOrg } = await admin
      .from('organizations')
      .select('id, name')
      .ilike('name', orgName)
      .maybeSingle()

    let organizationId = existingOrg?.id || null
    if (!organizationId) {
      const { data: org, error: createOrgErr } = await admin
        .from('organizations')
        .insert({ name: orgName } as any)
        .select('id')
        .single()
      if (createOrgErr) {
        return NextResponse.json(
          { error: 'Failed to create organization', details: createOrgErr.message },
          { status: 500 }
        )
      }
      organizationId = org!.id
    }

    // Create or get auth user
    let userId: string | null = null
    const { data: createdUser, error: createUserErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: '시공업체 관리자', role: 'admin' },
    })

    if (createUserErr && !String(createUserErr.message).toLowerCase().includes('already')) {
      const { data: list } = await admin.auth.admin.listUsers()
      const match = list?.users?.find(u => u.email?.toLowerCase() === email)
      if (!match) {
        return NextResponse.json(
          { error: 'Failed to create user', details: createUserErr.message },
          { status: 500 }
        )
      }
      userId = match.id
    } else {
      userId = createdUser?.user?.id || null
      if (!userId) {
        const { data: list } = await admin.auth.admin.listUsers()
        const match = list?.users?.find(u => u.email?.toLowerCase() === email)
        userId = match?.id || null
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve user id' }, { status: 500 })
    }

    // Ensure password
    try {
      await admin.auth.admin.updateUserById(userId, { password })
    } catch (err) {
      console.warn('[create-company-user] Failed to update password; continuing', err)
    }

    // Upsert profile with organization
    const { error: upsertErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: '시공업체 관리자',
        role: 'admin',
        organization_id: organizationId,
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

    return NextResponse.json({ success: true, user: { email }, organization_id: organizationId })
  } catch (error) {
    console.error('[create-company-user] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
