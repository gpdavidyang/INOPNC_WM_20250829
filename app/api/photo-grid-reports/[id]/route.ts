import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const legacyResponse = () =>
  NextResponse.json(
    {
      success: false,
      error:
        '포토 그리드 보고서 API는 더 이상 지원되지 않습니다. 최신 사진대지 관리를 사용하려면 /api/photo-sheets 엔드포인트를 이용해 주세요.',
    },
    { status: 410 }
  )

export async function GET(_request: NextRequest, _ctx: { params: { id: string } }) {
  return legacyResponse()
}

export async function PUT(_request: NextRequest, _ctx: { params: { id: string } }) {
  return legacyResponse()
}

export async function DELETE(_request: NextRequest, _ctx: { params: { id: string } }) {
  return legacyResponse()
}

export async function POST(_request: NextRequest, _ctx: { params: { id: string } }) {
  return legacyResponse()
}
