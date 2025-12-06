export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/app/auth/actions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }

    const result = await requestPasswordReset(email)
    if (result?.success) {
      return NextResponse.json(
        {
          success: true,
          message: '재설정 안내 메일을 발송했습니다. 받은 편지함과 스팸함을 확인해주세요.',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: result?.error || '재설정 메일 발송 중 오류가 발생했습니다.',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('[API][RESET-PASSWORD] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: '재설정 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
