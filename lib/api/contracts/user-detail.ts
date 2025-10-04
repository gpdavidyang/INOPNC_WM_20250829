import { z } from 'zod'

export const OrganizationRef = z.object({ id: z.string(), name: z.string().nullable().optional() })

export const SiteAssignment = z.object({
  site_id: z.string(),
  site_name: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  assigned_at: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

export const RequiredDocument = z.object({
  document_type: z.string(),
  status: z.enum(['submitted', 'pending']),
  submitted_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  file_path: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
})

export const WorkLogStats = z.object({
  total_reports: z.number(),
  this_month: z.number(),
  last_report_date: z.string().nullable().optional(),
})

export const UserDetail = z.object({
  id: z.string(),
  full_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  role: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  organization: OrganizationRef.nullable().optional(),
  site_assignments: z.array(SiteAssignment).optional(),
  required_documents: z.array(RequiredDocument).optional(),
  work_log_stats: WorkLogStats.optional(),
})

export type UserDetail = z.infer<typeof UserDetail>
