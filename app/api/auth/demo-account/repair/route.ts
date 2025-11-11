import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getDemoAccountConfig } from '@/lib/auth/demo-accounts'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json({ success: false, error: 'missing-email' }, { status: 400 })
    }

    const account = getDemoAccountConfig(email)
    if (!account) {
      return NextResponse.json({ success: false, error: 'unsupported-account' }, { status: 400 })
    }

    const admin = createServiceRoleClient()

    let profileId: string | null = null
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('email', email)
      .maybeSingle()

    if (profile?.id) {
      profileId = profile.id
    } else {
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.full_name, role: account.role },
      })

      if (createError || !createdUser?.user) {
        return NextResponse.json(
          { success: false, error: createError?.message || 'auth-create-failed' },
          { status: 500 }
        )
      }

      profileId = createdUser.user.id

      const { error: profileError } = await admin.from('profiles').upsert({
        id: profileId,
        email,
        full_name: account.full_name,
        role: account.role,
        status: 'active',
        organization_id: account.organization_id ?? null,
        partner_company_id: account.partner_company_id ?? null,
        site_id: account.site_id ?? null,
      })

      if (profileError) {
        return NextResponse.json({ success: false, error: profileError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        defaultPassword: account.password,
      })
    }

    const { error: resetError } = await admin.auth.admin.updateUserById(profileId, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: profile?.full_name || account.full_name,
        role: profile?.role || account.role,
      },
    })

    if (resetError) {
      return NextResponse.json(
        { success: false, error: resetError.message || 'reset-failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      action: 'reset',
      defaultPassword: account.password,
    })
  } catch (error) {
    console.error('[demo-account/repair] error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'unknown-error' },
      { status: 500 }
    )
  }
}
