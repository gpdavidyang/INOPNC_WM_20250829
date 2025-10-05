import { z } from 'zod'

export const Site = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  manager_name: z.string().nullable().optional(),
  manager_phone: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
})
export type Site = z.infer<typeof Site>

export const ListSitesRequest = z.object({
  q: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z.string().optional(),
  sort: z.string().optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  includeDeleted: z.boolean().optional(),
  onlyDeleted: z.boolean().optional(),
})
export type ListSitesRequest = z.infer<typeof ListSitesRequest>

export const ListSitesResponse = z.object({
  items: z.array(Site),
  total: z.number(),
})
export type ListSitesResponse = z.infer<typeof ListSitesResponse>
