import { z } from 'zod'

export const OrgRef = z.object({ id: z.string(), name: z.string().nullable().optional() })
export const SiteRef = z.object({ id: z.string(), name: z.string().nullable().optional() })
export const ProfileRef = z.object({
  full_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
})

export const DocumentSummary = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  category_type: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  site: SiteRef.nullable().optional(),
  uploader: ProfileRef.nullable().optional(),
})
export type DocumentSummary = z.infer<typeof DocumentSummary>

export const ListDocumentsRequest = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  siteId: z.string().optional(),
})
export type ListDocumentsRequest = z.infer<typeof ListDocumentsRequest>

export const ListDocumentsResponse = z.object({
  items: z.array(DocumentSummary),
  total: z.number(),
})
export type ListDocumentsResponse = z.infer<typeof ListDocumentsResponse>

// Detail contracts
export const DocumentDetail = DocumentSummary.extend({
  description: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  file_size: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export type DocumentDetail = z.infer<typeof DocumentDetail>

export const DocumentVersion = z.object({
  id: z.string(),
  version: z.number().nullable().optional(),
  version_number: z.number().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  created_by: ProfileRef.nullable().optional(),
  is_latest_version: z.boolean().nullable().optional(),
  change_summary: z.string().nullable().optional(),
})
export type DocumentVersion = z.infer<typeof DocumentVersion>

export const DocumentDownloadInfo = z.object({
  url: z.string(),
  filename: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  size: z.number().nullable().optional(),
})
export type DocumentDownloadInfo = z.infer<typeof DocumentDownloadInfo>
