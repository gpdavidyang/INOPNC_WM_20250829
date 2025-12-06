export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        '관리자 Direct Reset API는 비활성화되었습니다. 이메일 기반 비밀번호 재설정 플로우를 사용해주세요.',
    },
    { status: 410 }
  )
}
