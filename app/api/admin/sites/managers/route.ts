import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/managers?ids=uuid1,uuid2
// Response: { success, data: Record<siteId, { user_id: string; full_name: string }> }
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const url = new URL(req.url)
    const idsParam = url.searchParams.getAll('ids')
    const idsStr = idsParam.length > 1 ? idsParam : idsParam[0]?.split(',') || []
    const siteIds = Array.from(new Set(idsStr.map(s => s.trim()).filter(Boolean)))
    if (siteIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids query parameter required' },
        { status: 400 }
      )
    }

    const svc = createServiceRoleClient()

    const { data: assigns, error: assignErr } = await svc
      .from('site_assignments')
      .select('site_id, user_id, role, is_active')
      .in('site_id', siteIds)
      .eq('is_active', true)
      .eq('role', 'site_manager')

    if (assignErr) {
      console.error('[sites/managers] assignments error:', assignErr)
      return NextResponse.json(
        { success: false, error: 'Failed to load assignments' },
        { status: 500 }
      )
    }

    const managers = (assigns || []) as Array<{ site_id: string; user_id: string }>
    const userIds = Array.from(new Set(managers.map(a => a.user_id)))

    let profiles: Array<{ id: string; full_name: string }> = []
    if (userIds.length > 0) {
      const { data: profs, error: pErr } = await svc
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      if (pErr) {
        console.error('[sites/managers] profiles error:', pErr)
      } else {
        profiles = profs as any
      }
    }
    const pMap = new Map(profiles.map(p => [String(p.id), p.full_name || '']))

    const out: Record<string, { user_id: string; full_name: string }> = {}
    for (const m of managers) {
      const sid = String((m as any).site_id)
      if (!out[sid]) {
        const uid = String(m.user_id)
        out[sid] = { user_id: uid, full_name: pMap.get(uid) || uid }
      }
    }

    return NextResponse.json({ success: true, data: out })
  } catch (e) {
    console.error('[sites/managers] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
