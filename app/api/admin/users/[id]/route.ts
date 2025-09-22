import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getUser } from '@/app/actions/admin/users'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!['admin', 'system_admin'].includes(authResult.role || '')) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const userId = params.id
  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
  }

  const result = await getUser(userId)
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}
