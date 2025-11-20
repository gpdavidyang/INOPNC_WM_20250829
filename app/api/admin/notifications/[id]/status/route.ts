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
  const action = String(body?.action || 'read') as 'read' | 'ack' | 'reject'
  const statusMap: Record<string, string> = {
    read: 'read',
    ack: 'acknowledged',
    reject: 'rejected',
  }
  const status = statusMap[action] || 'read'
  try {
    const service = createServiceRoleClient()
    const { data: logRow, error: fetchError } = await service
      .from('notification_logs')
      .select('dispatch_id, dispatch_batch_id, announcement_id')
      .eq('id', params.id)
      .maybeSingle()
    if (fetchError) {
      console.error('[admin/notifications/:id/status] log fetch failed', fetchError)
    }
    const { error } = await service.from('notification_logs').update({ status }).eq('id', params.id)
    if (error) return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
    try {
      await service.from('notification_engagement').insert({
        notification_id: params.id,
        engagement_type: `admin_${action}`,
        engaged_at: new Date().toISOString(),
        user_id: auth.userId,
        metadata: {
          source: 'admin_dashboard',
          action,
          dispatch_id: logRow?.dispatch_id || null,
          dispatch_batch_id: logRow?.dispatch_batch_id || null,
          announcement_id: logRow?.announcement_id || null,
        },
      } as any)
    } catch (e) {
      console.warn('[admin/notifications/:id/status] engagement insert failed:', e)
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
