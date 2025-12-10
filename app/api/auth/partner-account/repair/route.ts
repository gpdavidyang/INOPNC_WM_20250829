import { NextRequest, NextResponse } from 'next/server'
import { ensurePartnerTestAccount } from '@/lib/auth/partner-test-account'

export const dynamic = 'force-dynamic'

const defaultAllowedEmails = ['partner@inopnc.com']
const allowedEmailsEnv =
  process.env.AUTH_PARTNER_TEST_EMAILS ||
  process.env.NEXT_PUBLIC_AUTH_PARTNER_TEST_EMAILS ||
  defaultAllowedEmails.join(',')

const allowedEmailsSet = new Set(
  allowedEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
)

if (allowedEmailsSet.size === 0) {
  defaultAllowedEmails.forEach(email => allowedEmailsSet.add(email))
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawEmail = typeof body?.email === 'string' ? body.email : ''
    const email = rawEmail ? normalizeEmail(rawEmail) : ''

    if (!email) {
      return NextResponse.json({ success: false, error: 'missing-email' }, { status: 400 })
    }

    if (!allowedEmailsSet.has(email)) {
      return NextResponse.json({ success: false, error: 'unsupported-email' }, { status: 403 })
    }

    const password =
      typeof body?.password === 'string' && body.password.trim().length >= 8
        ? body.password.trim()
        : undefined

    const companyName =
      typeof body?.company_name === 'string' && body.company_name.trim().length > 0
        ? body.company_name
        : undefined

    const fullName =
      typeof body?.full_name === 'string' && body.full_name.trim().length > 0
        ? body.full_name
        : undefined

    const role =
      typeof body?.role === 'string' && body.role.trim().length > 0 ? body.role.trim() : undefined

    const sitesLimit =
      typeof body?.sites_limit === 'number'
        ? body.sites_limit
        : Number.isFinite(Number(body?.sites_limit))
          ? Number(body?.sites_limit)
          : undefined

    const result = await ensurePartnerTestAccount({
      email,
      password,
      companyName,
      fullName,
      role,
      sitesLimit,
    })

    return NextResponse.json({
      success: true,
      email: result.email,
      partner_company_id: result.partnerCompanyId,
      defaultPassword: result.password,
    })
  } catch (error) {
    console.error('[partner-account/repair] error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'unknown-error' },
      { status: 500 }
    )
  }
}
