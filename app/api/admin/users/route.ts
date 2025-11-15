import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getUsers } from '@/app/actions/admin/users'
import type { UserRole, UserStatus } from '@/types'

export const dynamic = 'force-dynamic'

// GET /api/admin/users
// Query: page, limit, search, role, status
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20)
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim()
    const role = normalizeRole(searchParams.get('role'))
    const status = normalizeStatus(searchParams.get('status'))
    const sortBy = normalizeSortBy(searchParams.get('sort_by'))
    const sortOrder = normalizeSortOrder(searchParams.get('sort_order'))

    const result = await getUsers(
      page,
      limit,
      search,
      role,
      status,
      sortBy ?? 'created_at',
      sortOrder ?? 'desc'
    )

    if (!result.success) {
      const error = result.error || '사용자 목록을 불러오지 못했습니다.'
      const statusCode = /권한|허용/i.test(error) ? 403 : 500
      return NextResponse.json({ success: false, error }, { status: statusCode })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (e) {
    console.error('[admin/users] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

const ROLE_VALUES: UserRole[] = [
  'worker',
  'site_manager',
  'customer_manager',
  'admin',
  'system_admin',
]
const STATUS_VALUES: UserStatus[] = ['active', 'inactive', 'suspended']
const SORT_VALUES = [
  'created_at',
  'name',
  'role',
  'organization',
  'status',
  'last_activity',
] as const
const SORT_ORDER_VALUES = ['asc', 'desc'] as const
type SortParam = (typeof SORT_VALUES)[number]
type SortOrderParam = (typeof SORT_ORDER_VALUES)[number]

function normalizeRole(value: string | null): UserRole | undefined {
  if (!value || value === 'all') return undefined
  const candidate = value === 'partner' ? 'customer_manager' : value
  return ROLE_VALUES.includes(candidate as UserRole) ? (candidate as UserRole) : undefined
}

function normalizeStatus(value: string | null): UserStatus | undefined {
  if (!value || value === 'all') return undefined
  return STATUS_VALUES.includes(value as UserStatus) ? (value as UserStatus) : undefined
}

function normalizeSortBy(value: string | null): SortParam | undefined {
  if (!value) return undefined
  return SORT_VALUES.includes(value as SortParam) ? (value as SortParam) : undefined
}

function normalizeSortOrder(value: string | null): SortOrderParam | undefined {
  if (!value) return undefined
  return SORT_ORDER_VALUES.includes(value as SortOrderParam) ? (value as SortOrderParam) : undefined
}
