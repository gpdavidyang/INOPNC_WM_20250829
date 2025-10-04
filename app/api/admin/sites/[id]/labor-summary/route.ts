import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getSiteLaborSummary } from '@/lib/api/adapters/site-assignments'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    if (!['admin', 'system_admin', 'site_manager'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const siteId = params.id
    const url = new URL(request.url)
    const usersParam = url.searchParams.get('users') // comma-separated
    const users = usersParam
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const data = await getSiteLaborSummary(siteId, users && users.length > 0 ? users : undefined)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
