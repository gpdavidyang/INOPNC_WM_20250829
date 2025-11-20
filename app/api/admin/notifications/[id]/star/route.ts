import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const starred = Boolean(body?.starred)
  try {
    const service = createServiceRoleClient()
    const { data: log } = await service
      .from('notification_logs')
      .select('dispatch_id, dispatch_batch_id, announcement_id')
      .eq('id', params.id)
      .maybeSingle()

    await service.from('notification_engagement').insert({
      notification_id: params.id,
      user_id: auth.userId,
      engagement_type: starred ? 'admin_starred' : 'admin_unstarred',
      engaged_at: new Date().toISOString(),
      metadata: {
        source: 'admin_dashboard',
        action: starred ? 'star' : 'unstar',
        dispatch_id: log?.dispatch_id || null,
        dispatch_batch_id: log?.dispatch_batch_id || null,
        announcement_id: log?.announcement_id || null,
      },
    } as any)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
