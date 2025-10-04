import { z } from 'zod'

export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z
    .enum(['admin', 'manager', 'worker', 'system_admin', 'customer_manager', 'partner'])
    .optional(),
  createdAt: z.string().optional(),
})
export type User = z.infer<typeof User>

export const ListUsersRequest = z.object({
  q: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
})
export type ListUsersRequest = z.infer<typeof ListUsersRequest>

export const ListUsersResponse = z.object({
  items: z.array(User),
  total: z.number(),
})
export type ListUsersResponse = z.infer<typeof ListUsersResponse>
