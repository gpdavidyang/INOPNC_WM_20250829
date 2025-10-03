export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function normalizePhone(input: string): string {
  return (input || '').replace(/\D/g, '')
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const visible = Math.min(3, user.length)
  const maskedUser = user.slice(0, visible) + '*'.repeat(Math.max(user.length - visible, 1))
  return `${maskedUser}@${domain}`
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email } = await req.json().catch(() => ({}))
    if (!name || !phone) {
      return NextResponse.json({ error: '이름과 휴대폰 번호를 입력해주세요.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: '서버 설정이 올바르지 않습니다.' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const normPhone = normalizePhone(phone)

    // Step 1: find candidates by exact name
    const { data: candidates, error } = await admin
      .from('profiles')
      .select('email, full_name, phone')
      .ilike('full_name', name)

    if (error) {
      return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    const matched = (candidates || []).find(
      p =>
        normalizePhone(p.phone || '') === normPhone &&
        (!email || (p.email || '').toLowerCase() === String(email).toLowerCase())
    )

    if (!matched) {
      return NextResponse.json({ success: false, message: '일치하는 계정을 찾을 수 없습니다.' })
    }

    return NextResponse.json({ success: true, email: maskEmail(matched.email) })
  } catch (e) {
    console.error('[FIND-ID] Error:', e)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
