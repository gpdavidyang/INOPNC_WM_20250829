import { NextRequest, NextResponse } from 'next/server'
import { ensurePartnerTestAccount } from '@/lib/auth/partner-test-account'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const email = body?.email || 'partner@inopnc.com'
    const password = body?.password || 'password123'
    const companyName = body?.company_name || 'INOPNC Partner (테스트)'
    const sitesLimit = Number(body?.sites_limit ?? 3)
    const result = await ensurePartnerTestAccount({
      email,
      password,
      companyName,
      fullName: body?.full_name,
      role: body?.role,
      sitesLimit,
    })

    return NextResponse.json({
      success: true,
      user: { email: result.email },
      partner_company_id: result.partnerCompanyId,
    })
  } catch (error) {
    console.error('[create-partner-user] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
