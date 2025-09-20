import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_AUDIT_LOG_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role } = authResult

  if (!role || !['admin', 'system_admin'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Number.parseInt(limitParam, 10)) : ADMIN_AUDIT_LOG_STUB.length

  return NextResponse.json({
    success: true,
    logs: ADMIN_AUDIT_LOG_STUB.slice(0, limit),
  })
}
