import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getUserDetail } from '@/lib/api/adapters/user-detail'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    const includeInactive = (() => {
      try {
        const sp = new URL(request.url).searchParams
        const v = sp.get('includeInactive')
        return v === '1' || v === 'true'
      } catch {
        return false
      }
    })()
    const user = await getUserDetail(userId, includeInactive)
    if (!user)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch (e) {
    console.error('[admin/users/:id] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
