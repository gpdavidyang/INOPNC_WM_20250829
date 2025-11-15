import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getMarkupDocuments } from '@/app/actions/admin/markup'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import ToolPageClient from './ToolPageClient'

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
      ?.filter(row => typeof row.file_url === 'string' && row.file_url.length > 0)
      .map(row => {
        const metadata =
          row.metadata && typeof row.metadata === 'object'
            ? (row.metadata as Record<string, any>)
            : {}
        return {
          id: `shared-${row.id}`,
          source: 'shared' as const,
          title: row.title || row.file_name || '도면',
          description: row.description || metadata?.description || '',
          original_blueprint_url: row.file_url,
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
          daily_report: null,
        }
      }) || []

  const docs = [
    ...markupDocs.map(doc => ({ ...doc, source: 'markup' as const })),
    ...sharedDocs,
  ].sort((a, b) => {
    const at = new Date(a.created_at || 0).getTime()
    const bt = new Date(b.created_at || 0).getTime()
    return bt - at
  })

  return <ToolPageClient docs={docs} siteOptions={siteOptions} />
}
