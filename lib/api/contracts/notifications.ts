import { z } from 'zod'

export const NotificationLog = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  notification_type: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
})
export type NotificationLog = z.infer<typeof NotificationLog>

export const ListNotificationsRequest = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
})
export type ListNotificationsRequest = z.infer<typeof ListNotificationsRequest>

export const ListNotificationsResponse = z.object({
  items: z.array(NotificationLog),
  total: z.number(),
})
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponse>

// Admin actions
export const UpdateNotificationStatusRequest = z.object({
  id: z.string(),
  action: z.enum(['read', 'ack', 'reject']),
})
export type UpdateNotificationStatusRequest = z.infer<typeof UpdateNotificationStatusRequest>

export const ToggleNotificationStarRequest = z.object({
  id: z.string(),
  starred: z.boolean(),
})
export type ToggleNotificationStarRequest = z.infer<typeof ToggleNotificationStarRequest>

export const AdminActionResponse = z.object({ success: z.boolean() })
export type AdminActionResponse = z.infer<typeof AdminActionResponse>
