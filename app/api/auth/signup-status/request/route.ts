export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/security/rate-limiter'
import {
  createInvalidVerification,
  createVerification,
  IDENTITY_VERIFICATION_TTL_MINUTES,
} from '@/lib/auth/identity-verification'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
  const rl = new RateLimiter()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await rl.isRateLimited(`signup-status-request:${ip}`, 'auth')
  if (rate.limited) {
    return new NextResponse(
      JSON.stringify({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 429, headers: rl.getRateLimitHeaders(rate) }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const email = (body?.email || '').toString().trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { success: false, error: '가입 신청 시 사용한 이메일을 입력해주세요.' },
        { status: 400 }
      )
    }

    const admin = createServiceRoleClient()
    const { data: requestRows, error } = await admin
      .from('signup_requests')
      .select('id, full_name')
      .eq('email', email)
      .order('requested_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[signup-status][request] signup_requests query error:', error)
      return NextResponse.json(
        { success: false, error: '가입 정보를 조회하지 못했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    const request = requestRows?.[0]

    if (!request) {
      const invalidId = await createInvalidVerification('signup_status')
      return NextResponse.json(
        {
          success: true,
          verificationId: invalidId,
          expiresInMinutes: IDENTITY_VERIFICATION_TTL_MINUTES,
          message: '입력하신 이메일로 인증 코드를 전송했습니다.',
        },
        { status: 200, headers: rl.getRateLimitHeaders(rate) }
      )
    }

    const { id } = await createVerification({
      flow: 'signup_status',
      profileId: null,
      email,
      metadata: { email },
      recipientName: request.full_name,
      emailSubject: '[INOPNC] 가입 상태 확인 인증 코드',
      emailBodyBuilder: code =>
        `안녕하세요 ${request.full_name || ''}님,

가입 승인 상태를 확인하려면 아래 인증 코드를 입력해주세요.

인증코드: ${code}
유효시간: ${IDENTITY_VERIFICATION_TTL_MINUTES}분

본인이 요청한 것이 아니라면 즉시 관리자에게 알려주세요.`,
    })

    return NextResponse.json(
      {
        success: true,
        verificationId: id,
        expiresInMinutes: IDENTITY_VERIFICATION_TTL_MINUTES,
        message: '입력하신 이메일로 인증 코드를 전송했습니다.',
      },
      { status: 200, headers: rl.getRateLimitHeaders(rate) }
    )
  } catch (error) {
    console.error('[signup-status][request] error:', error)
    return NextResponse.json(
      { success: false, error: '요청을 처리하지 못했습니다.' },
      { status: 500 }
    )
  }
}
