import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: '가입 상태 조회 API가 변경되었습니다. 신규 인증 절차를 사용해주세요.',
    },
    { status: 410 }
  )
}
