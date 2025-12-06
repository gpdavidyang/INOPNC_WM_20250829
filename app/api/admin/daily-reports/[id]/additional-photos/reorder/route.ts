'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { reorderAdditionalPhotos } from '@/app/actions/admin/daily-reports'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const reportId = params.id
    if (!reportId) {
      return NextResponse.json({ success: false, error: 'Report ID is required.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const updates = Array.isArray(body?.updates) ? body.updates : []

    const result = await reorderAdditionalPhotos(reportId, updates)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('[admin/daily-reports/reorder] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
