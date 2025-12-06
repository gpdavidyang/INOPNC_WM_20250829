export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/security/rate-limiter'
import { verifyIdentityCode } from '@/lib/auth/identity-verification'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
  const rl = new RateLimiter()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await rl.isRateLimited(`signup-status-verify:${ip}`, 'auth')
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

    if (verification.flow !== 'signup_status') {
      return NextResponse.json(
        { success: false, error: '인증 정보가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const email =
      (verification.metadata as { email?: string } | null)?.email || verification.email || null

    if (!email) {
      return NextResponse.json(
        { success: false, error: '인증 정보가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const admin = createServiceRoleClient()
    const { data: request } = await admin
      .from('signup_requests')
      .select('status, approved_at, rejected_at')
      .eq('email', email)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json(
      {
        success: true,
        status: request?.status || null,
        message:
          request?.status === 'approved'
            ? '가입이 승인되었습니다. 이메일로 안내된 절차에 따라 로그인해주세요.'
            : request?.status === 'rejected'
              ? '가입 요청이 반려되었습니다. 고객센터로 문의해주세요.'
              : request?.status === 'pending'
                ? '가입 승인 대기 중입니다. 담당자가 확인 후 안내드리겠습니다.'
                : '해당 이메일로 접수된 요청이 없습니다. 다시 신청해 주세요.',
      },
      { status: 200, headers: rl.getRateLimitHeaders(rate) }
    )
  } catch (error) {
    console.error('[signup-status][verify] error:', error)
    return NextResponse.json(
      { success: false, error: '인증을 처리하지 못했습니다.' },
      { status: 500 }
    )
  }
}
