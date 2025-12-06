export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/security/rate-limiter'
import { verifyIdentityCode } from '@/lib/auth/identity-verification'

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@')
  if (!domain) return email.replace(/.(?=.{2})/g, '*')
  const first = user.slice(0, 2)
  const last = user.slice(-1)
  const maskedMiddle = '*'.repeat(Math.max(1, user.length - 3))
  return `${first}${maskedMiddle}${last}@${domain}`
}

export async function POST(req: NextRequest) {
  const rl = new RateLimiter()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await rl.isRateLimited(`find-id-verify:${ip}`, 'auth')
  if (rate.limited) {
    return new NextResponse(
      JSON.stringify({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 429, headers: rl.getRateLimitHeaders(rate) }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const verificationId = (body?.verificationId || '').toString().trim()
    const code = (body?.code || '').toString().trim()

    if (!verificationId || !code) {
      return NextResponse.json(
        { success: false, error: '인증 요청을 다시 진행해주세요.' },
        { status: 400 }
      )
    }

    const verification = await verifyIdentityCode({ verificationId, code })
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || '인증에 실패했습니다.' },
        { status: 400 }
      )
    }

    if (verification.flow !== 'find_id' || !verification.email) {
      return NextResponse.json(
        { success: false, error: '인증 정보가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        email: maskEmail(verification.email),
        message:
          '등록된 이메일 주소를 확인했습니다. 해당 이메일로 로그인 후 비밀번호를 재설정할 수 있습니다.',
      },
      { status: 200, headers: rl.getRateLimitHeaders(rate) }
    )
  } catch (error) {
    console.error('[find-id][verify] error:', error)
    return NextResponse.json(
      { success: false, error: '인증을 처리하지 못했습니다.' },
      { status: 500 }
    )
  }
}
