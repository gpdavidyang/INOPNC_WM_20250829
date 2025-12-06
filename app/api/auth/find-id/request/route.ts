export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/security/rate-limiter'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  createInvalidVerification,
  createVerification,
  IDENTITY_VERIFICATION_TTL_MINUTES,
} from '@/lib/auth/identity-verification'

const normalizePhone = (value: string) => value.replace(/\D/g, '')

export async function POST(req: NextRequest) {
  const rl = new RateLimiter()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await rl.isRateLimited(`find-id-request:${ip}`, 'auth')
  if (rate.limited) {
    return new NextResponse(
      JSON.stringify({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 429, headers: rl.getRateLimitHeaders(rate) }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const name = (body?.name || '').toString().trim()
    const phone = (body?.phone || '').toString().trim()

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '이름과 휴대폰 번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const admin = createServiceRoleClient()
    const normalizedPhone = normalizePhone(phone)
    const { data: profileRows, error } = await admin
      .from('profiles')
      .select('id, email, full_name, phone')
      .eq('full_name', name)
      .limit(10)

    if (error) {
      console.error('[find-id][request] profile lookup error:', error)
      return NextResponse.json(
        { success: false, error: '계정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    const profile = (profileRows || []).find(
      row => normalizePhone(row?.phone || '') === normalizedPhone
    )

    if (!profile || !profile.email) {
      const invalidId = await createInvalidVerification('find_id')
      return NextResponse.json(
        {
          success: true,
          verificationId: invalidId,
          expiresInMinutes: IDENTITY_VERIFICATION_TTL_MINUTES,
          message: '인증 코드를 전송했습니다. 받은 편지함과 스팸함을 확인해주세요.',
        },
        { status: 200, headers: rl.getRateLimitHeaders(rate) }
      )
    }

    const storedPhone = normalizePhone(profile.phone || '')
    if (!storedPhone || storedPhone !== normalizedPhone) {
      const invalidId = await createInvalidVerification('find_id')
      return NextResponse.json(
        {
          success: true,
          verificationId: invalidId,
          expiresInMinutes: IDENTITY_VERIFICATION_TTL_MINUTES,
          message: '인증 코드를 전송했습니다. 받은 편지함과 스팸함을 확인해주세요.',
        },
        { status: 200, headers: rl.getRateLimitHeaders(rate) }
      )
    }

    const { id } = await createVerification({
      flow: 'find_id',
      profileId: profile.id,
      email: profile.email,
      recipientName: profile.full_name,
      emailSubject: '[INOPNC] 아이디 확인 인증 코드',
      emailBodyBuilder: code =>
        `안녕하세요 ${profile.full_name || ''}님,

요청하신 아이디 확인을 위해 아래 인증 코드를 입력해주세요.

인증코드: ${code}
유효시간: ${IDENTITY_VERIFICATION_TTL_MINUTES}분

본인이 요청한 것이 아니라면 즉시 관리자에게 알려주세요.`,
    })

    return NextResponse.json(
      {
        success: true,
        verificationId: id,
        expiresInMinutes: IDENTITY_VERIFICATION_TTL_MINUTES,
        message: '인증 코드를 전송했습니다. 받은 편지함과 스팸함을 확인해주세요.',
      },
      { status: 200, headers: rl.getRateLimitHeaders(rate) }
    )
  } catch (error) {
    console.error('[find-id][request] error:', error)
    return NextResponse.json(
      { success: false, error: '요청을 처리하지 못했습니다.' },
      { status: 500 }
    )
  }
}
