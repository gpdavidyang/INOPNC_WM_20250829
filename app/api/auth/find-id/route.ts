import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: '이 아이디 찾기 API는 더 이상 지원하지 않습니다. 새로운 인증 절차를 이용해주세요.',
    },
    { status: 410 }
  )
}
