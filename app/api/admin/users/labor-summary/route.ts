import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getGlobalLaborSummary } from '@/lib/api/adapters/site-assignments'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/labor-summary?users=a,b,c
// Returns { success, data: { [user_id]: manDays } }
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin', 'site_manager'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const sp = new URL(request.url).searchParams
    const usersParam = sp.get('users')
    const users = usersParam
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const data = await getGlobalLaborSummary(users && users.length > 0 ? users : undefined)
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
