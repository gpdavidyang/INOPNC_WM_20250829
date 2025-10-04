import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { listUsers } from '@/lib/api/adapters/user'
import type { ListUsersRequest } from '@/lib/api/contracts/user'

export const dynamic = 'force-dynamic'

// GET /api/admin/users
// Query: page, limit, search, role, status
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // Admin/system_admin only
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const req: ListUsersRequest = {
      page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1),
      pageSize: Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20),
      q: (searchParams.get('search') || searchParams.get('q') || '').trim() || undefined,
      sort: undefined,
    }

    const result = await listUsers(req)
    const pages = Math.max(1, Math.ceil(result.total / req.pageSize))
    // Map adapter result to existing UI-friendly shape
    const users = result.items.map((u: any) => ({
      id: u.id,
      full_name: u.name || null,
      email: u.email || null,
      role: u.role || null,
      status: null,
      phone: null,
      organization: null,
      work_log_stats: null,
    }))

    return NextResponse.json({ success: true, data: { users, total: result.total, pages } })
  } catch (e) {
    console.error('[admin/users] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
