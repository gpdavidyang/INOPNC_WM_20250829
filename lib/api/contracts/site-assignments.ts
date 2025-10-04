import { z } from 'zod'

export const OrganizationRef = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
})

export const AssignmentProfile = z.object({
  id: z.string(),
  full_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  role: z.string().nullable().optional(),
  organization: OrganizationRef.optional().nullable(),
})

export const SiteAssignment = z.object({
  site_id: z.string(),
  user_id: z.string(),
  role: z.string(),
  assigned_at: z.string().nullable().optional(),
  assigned_date: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  profile: AssignmentProfile.nullable().optional(),
})

export type SiteAssignment = z.infer<typeof SiteAssignment>

export const ListSiteAssignmentsResponse = z.array(SiteAssignment)
export type ListSiteAssignmentsResponse = z.infer<typeof ListSiteAssignmentsResponse>

export const SiteLaborSummaryResponse = z.record(z.string(), z.number())
export type SiteLaborSummaryResponse = z.infer<typeof SiteLaborSummaryResponse>
