export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json().catch(() => ({}))

    if (!email || !newPassword) {
      return NextResponse.json({ error: '이메일과 새 비밀번호를 입력하세요.' }, { status: 400 })
    }

    // Basic password rule to mirror legacy: at least 6 digits
    const numericMin6 = /^[0-9]{6,}$/
    if (!numericMin6.test(newPassword)) {
      return NextResponse.json(
        { error: '비밀번호는 숫자 6자리 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: '서버 설정이 올바르지 않습니다.' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find user id via profiles table by email
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    const userId = profile?.id
    if (!userId) {
      // To avoid user enumeration, return generic error
      return NextResponse.json(
        { error: '계정을 찾을 수 없습니다. 정보를 확인해주세요.' },
        { status: 404 }
      )
    }

    // Update password directly via Admin API
    await admin.auth.admin.updateUserById(userId, { password: newPassword })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DIRECT-PASSWORD-RESET] Error:', e)
    return NextResponse.json({ error: '비밀번호 변경 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
