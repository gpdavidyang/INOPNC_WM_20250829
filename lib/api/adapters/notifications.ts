import { createClient } from '@/lib/supabase/server'
import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  UpdateNotificationStatusRequest,
  ToggleNotificationStarRequest,
} from '../contracts/notifications'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function listNotificationLogs(
  req: ListNotificationsRequest
): Promise<ListNotificationsResponse> {
  const supabase = createClient()
  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notification_logs')
    .select('*', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(from, to)

  if (req.search) {
    query = query.or(
      `title.ilike.%${req.search}%,body.ilike.%${req.search}%,notification_type.ilike.%${req.search}%`
    )
  }

  const { data, count, error } = await query
  if (error) return { items: [], total: 0 }
  return { items: (data || []) as any, total: count || 0 }
}

export async function adminUpdateNotificationStatus({
  id,
  action,
}: UpdateNotificationStatusRequest): Promise<{ success: boolean }> {
  const service = createServiceRoleClient()
  const statusMap: Record<string, string> = {
    read: 'read',
    ack: 'acknowledged',
    reject: 'rejected',
  }
  const status = statusMap[action] || 'read'
  const { error } = await service.from('notification_logs').update({ status }).eq('id', id)
  if (!error) {
    try {
      await service.from('notification_engagement').insert({
        notification_id: id,
        engagement_type: `admin_${action}`,
        engaged_at: new Date().toISOString(),
      } as any)
    } catch (e) {
      console.warn('[adminUpdateNotificationStatus] engagement insert failed:', e)
    }
    return { success: true }
  }
  return { success: false }
}

export async function adminToggleNotificationStar({
  id,
  starred,
}: ToggleNotificationStarRequest): Promise<{ success: boolean }> {
  const service = createServiceRoleClient()
  try {
    await service.from('notification_engagement').insert({
      notification_id: id,
      engagement_type: starred ? 'admin_starred' : 'admin_unstarred',
      engaged_at: new Date().toISOString(),
    } as any)
    return { success: true }
  } catch (e) {
    console.warn('[adminToggleNotificationStar] toggle failed:', e)
    return { success: false }
  }
}
