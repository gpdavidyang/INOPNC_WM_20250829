import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getMarkupDocuments } from '@/app/actions/admin/markup'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import ToolPageClient from './ToolPageClient'

function resolveSharedDocFileUrl(row: Record<string, any>): string | null {
  if (!row) return null
  const metadata =
    row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, any>) : {}
  const candidates = [
    row.file_url,
    row.fileUrl,
    row.original_file_url,
    metadata.public_url,
    metadata.preview_url,
    metadata.file_url,
    metadata.signed_url,
    metadata.remote_url,
  ]
  for (const url of candidates) {
    if (typeof url === 'string' && url.trim().length > 0) {
      return url
    }
  }
  return null
}

export const metadata: Metadata = {
  title: '도면마킹 관리',
}

export default async function AdminMarkupToolPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  // Launcher: recent docs and quick start
  const result = await getMarkupDocuments(1, 200)
  const markupDocs =
    result.success && result.data ? (((result.data as any).documents as any[]) ?? []) : []
  const supabase = createClient()
  const service = createServiceRoleClient()
  const { data: siteRows } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_deleted', false)
    .order('name', { ascending: true })

  const siteOptions =
    siteRows?.map(site => ({
      id: site.id as string,
      name: (site.name as string) || '이름없음',
    })) || []

  const { data: sharedRows } = await service
    .from('unified_document_system')
    .select(
      `
      id,
      title,
      description,
      file_url,
      file_name,
      created_at,
      site_id,
      metadata,
      profiles:profiles!unified_document_system_uploaded_by_fkey(full_name, email),
      site:sites(id, name)
    `
    )
    .eq('category_type', 'shared')
    .eq('status', 'active')
    .eq('is_archived', false)
    .in('sub_category', ['progress_drawing', 'construction_drawing', 'plan', 'blueprint'])
    .limit(200)

  const sharedDocs =
    sharedRows
      ?.map(row => {
        const metadata =
          row.metadata && typeof row.metadata === 'object'
            ? (row.metadata as Record<string, any>)
            : {}
        const fileUrl = resolveSharedDocFileUrl(row)
        if (!fileUrl) return null
        const unifiedDocumentId = row.id as string
        const linkedIds =
          Array.isArray(metadata?.linked_worklog_ids) && metadata.linked_worklog_ids.length > 0
            ? metadata.linked_worklog_ids.filter(
                (value: unknown): value is string => typeof value === 'string' && value.length > 0
              )
            : metadata?.linked_worklog_id
              ? [metadata.linked_worklog_id]
              : []
        return {
          id: `shared-${unifiedDocumentId}`,
          unified_document_id: unifiedDocumentId,
          source: 'shared' as const,
          title: row.title || row.file_name || '도면',
          description: row.description || metadata?.description || '',
          original_blueprint_url: fileUrl,
          original_blueprint_filename: row.file_name || '도면',
          created_at: row.created_at,
          site_id: row.site_id,
          site: row.site
            ? {
                id: row.site.id,
                name: row.site.name || '미지정',
              }
            : null,
          creator: row.profiles
            ? {
                full_name: row.profiles.full_name,
                email: row.profiles.email,
              }
            : null,
          linked_worklog_id: metadata?.linked_worklog_id || null,
          linked_worklog_ids: linkedIds,
          daily_report: null,
        }
      })
      .filter(Boolean) || []

  const docs = [
    ...markupDocs.map(doc => ({
      ...doc,
      source: 'markup' as const,
      linked_worklog_ids:
        Array.isArray(doc.linked_worklog_ids) && doc.linked_worklog_ids.length > 0
          ? doc.linked_worklog_ids
          : doc.linked_worklog_id
            ? [doc.linked_worklog_id]
            : [],
    })),
    ...sharedDocs,
  ].sort((a, b) => {
    const at = new Date(a.created_at || 0).getTime()
    const bt = new Date(b.created_at || 0).getTime()
    return bt - at
  })

  return <ToolPageClient docs={docs} siteOptions={siteOptions} />
}
