import { NextRequest, NextResponse } from 'next/server'
import { createMaterialRequest } from '@/app/actions/materials-inventory'
import { DEFAULT_MATERIAL_PRIORITY, isMaterialPriorityValue } from '@/lib/materials/priorities'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { siteId, materialCode, qty, requestDate, notes, unitId, priority } = body || {}

    if (!siteId || !materialCode || !qty || Number(qty) <= 0) {
      return NextResponse.json(
        { success: false, error: '유효한 현장, 자재, 수량이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await createMaterialRequest({
      siteId,
      materialCode,
      qty: Number(qty),
      requestDate,
      notes,
      unitId,
      priority: isMaterialPriorityValue(priority) ? priority : DEFAULT_MATERIAL_PRIORITY,
    })

    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || '자재 요청을 저장하지 못했습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[mobile/material-requests] error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
