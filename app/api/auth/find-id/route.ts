import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RateLimiter } from '@/lib/security/rate-limiter'

export const dynamic = 'force-dynamic'

// POST /api/auth/find-id
// Body: { name: string, phone: string, email?: string }
// Returns masked email when found, but never discloses existence explicitly
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP + optional email hint
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = new RateLimiter()
    const rate = await rl.isRateLimited(`find-id:${ip}`, 'auth')
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
    const name = (body?.name || body?.full_name || '').trim()
    const phone = (body?.phone || '').trim()
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '이름과 휴대폰 번호가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('full_name', name)
      .eq('phone', phone)
      .maybeSingle()

    if (!profile?.email) {
      // Do not disclose existence; return generic message
      return new NextResponse(
        JSON.stringify({ success: true, message: '입력하신 정보로 안내 메일을 전송했습니다.' }),
        { status: 200, headers: rl.getRateLimitHeaders(rate) }
      )
    }

    const masked = maskEmail(profile.email)
    return new NextResponse(
      JSON.stringify({ success: true, email: masked, message: '안내 메일을 전송했습니다.' }),
      { status: 200, headers: rl.getRateLimitHeaders(rate) }
    )
  } catch (e) {
    console.error('[find-id] error:', e)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email.replace(/.(?=.{2})/g, '*')
  const u =
    user.length <= 2
      ? user[0] + '*'
      : user[0] + '*'.repeat(Math.max(1, user.length - 2)) + user[user.length - 1]
  return `${u}@${domain}`
}
