export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateMfaSecretForAccessToken } from '@/lib/auth/mfa-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const providedToken = body?.access_token || body?.accessToken

    if (!providedToken || typeof providedToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'access_token이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await generateMfaSecretForAccessToken(providedToken)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('[API][MFA-GENERATE] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'MFA 정보를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
