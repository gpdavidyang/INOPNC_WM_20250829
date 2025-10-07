import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RateLimiter } from '@/lib/security/rate-limiter'

export const dynamic = 'force-dynamic'

// GET /api/auth/signup-request/status?email=
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = new RateLimiter()
    const rate = await rl.isRateLimited(`signup-status:${ip}`, 'auth')
    if (rate.limited) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        }),
        { status: 429, headers: rl.getRateLimitHeaders(rate) }
      )
    }
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email 파라미터가 필요합니다.' },
        { status: 400 }
      )
    }
    const supabase = createClient()
    const { data: request } = await supabase
      .from('signup_requests')
      .select('status, approved_at, rejected_at')
      .eq('email', email)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!request) {
      // Generic response to avoid account enumeration
      return new NextResponse(
        JSON.stringify({ success: true, status: null, message: '요청 내역을 확인했습니다.' }),
        { status: 200, headers: rl.getRateLimitHeaders(rate) }
      )
    }

    return new NextResponse(JSON.stringify({ success: true, status: request.status || null }), {
      status: 200,
      headers: rl.getRateLimitHeaders(rate),
    })
  } catch (e) {
    console.error('[signup-request/status] error:', e)
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
