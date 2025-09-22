import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getUsers } from '@/app/actions/admin/users'
import type { UserRole, UserStatus } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!['admin', 'system_admin'].includes(authResult.role || '')) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
  const limitParam = Number.parseInt(searchParams.get('limit') || '10', 10)
  const search = searchParams.get('search') || ''
  const roleParam = (searchParams.get('role') || '') as UserRole | ''
  const statusParam = (searchParams.get('status') || '') as UserStatus | ''

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10
  const role = roleParam ? (roleParam as UserRole) : undefined
  const status = statusParam ? (statusParam as UserStatus) : undefined

  const result = await getUsers(page, limit, search, role, status)

  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
