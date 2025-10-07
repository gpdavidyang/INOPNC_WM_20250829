import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RateLimiter } from '@/lib/security/rate-limiter'

export const dynamic = 'force-dynamic'

// POST /api/auth/signup-request/resend { email }
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = new RateLimiter()
    const rate = await rl.isRateLimited(`signup-resend:${ip}`, 'auth')
    if (rate.limited) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        }),
        { status: 429, headers: rl.getRateLimitHeaders(rate) }
      )
    }
    const body = await req.json().catch(() => ({}))
    const email = String(body?.email || '')
      .trim()
      .toLowerCase()
    if (!email) {
      return NextResponse.json({ success: false, error: 'email이 필요합니다.' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: request } = await supabase
      .from('signup_requests')
      .select('status')
      .eq('email', email)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!request || request.status !== 'pending') {
      // Always respond success to avoid enumeration
      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: rl.getRateLimitHeaders(rate),
      })
    }

    // TODO: Integrate email notification service for reminder (non-blocking)
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: rl.getRateLimitHeaders(rate),
    })
  } catch (e) {
    console.error('[signup-request/resend] error:', e)
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
