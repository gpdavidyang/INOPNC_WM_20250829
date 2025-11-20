import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getMarkupDocuments } from '@/app/actions/admin/markup'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import ToolPageClient, { type ToolPageClientSearchParams } from './ToolPageClient'

function resolveSharedDocFileUrl(row: Record<string, any>): string | null {
  if (!row) return null
  const metadata =
    row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, any>) : {}
  const preferBlueprintFromMetadata =
    metadata?.source_table === 'markup_documents' ||
    typeof metadata?.markup_document_id === 'string'

  const isMarkupProxyUrl = (value: string | null | undefined) => {
    if (typeof value !== 'string') return false
    const trimmed = value.trim()
    if (!trimmed) return false
    return trimmed.includes('/api/markup-documents/') && trimmed.includes('/file')
  }

  const candidates: string[] = []
  const pushCandidate = (value?: string | null) => {
    if (typeof value !== 'string') return
    const trimmed = value.trim()
    if (!trimmed) return
    candidates.push(trimmed)
  }

  if (preferBlueprintFromMetadata) {
    pushCandidate(metadata.original_blueprint_url)
    pushCandidate(metadata.preview_image_url)
    pushCandidate(metadata.snapshot_pdf_url)
  }

  pushCandidate(row.file_url)
  pushCandidate(row.fileUrl)
  pushCandidate(row.original_file_url)
  pushCandidate(metadata.public_url)
  pushCandidate(metadata.preview_url)
  pushCandidate(metadata.file_url)
  pushCandidate(metadata.signed_url)
  pushCandidate(metadata.remote_url)

  if (!preferBlueprintFromMetadata) {
    pushCandidate(metadata.original_blueprint_url)
    pushCandidate(metadata.preview_image_url)
    pushCandidate(metadata.snapshot_pdf_url)
  }

  for (const url of candidates) {
    if (isMarkupProxyUrl(url)) continue
    return url
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
      markup_data,
      metadata,
      profiles:profiles!unified_document_system_uploaded_by_fkey(full_name, email),
      site:sites(id, name)
    `
    )
    .eq('category_type', 'shared')
    .eq('status', 'active')
    .eq('is_archived', false)
    .limit(200)

  const { data: sharedRowsV2 } = await service
    .from('unified_documents')
    .select(
      `
      id,
      title,
      description,
      file_url,
      file_name,
      created_at,
      site_id,
      markup_data,
      metadata,
      uploaded_by,
      category_type,
      sub_category,
      status,
      site:sites(id, name)
    `
    )
    .eq('category_type', 'shared')
    .eq('status', 'active')
    .limit(200)

  const normalizeSharedDoc = (row: any | null, opts?: { fallbackCategory?: string }) => {
    if (!row) return null
    const metadata =
      row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, any>) : {}
    const fileUrl = resolveSharedDocFileUrl({
      ...row,
      metadata,
    })
    if (!fileUrl) return null
    const unifiedDocumentId = row.id as string
    const linkedMarkupId =
      metadata?.source_table === 'markup_documents'
        ? metadata.markup_document_id || metadata.source_id
        : metadata?.markup_document_id || null
    const sourceSiteDocId =
      typeof metadata?.source_site_document_id === 'string'
        ? metadata.source_site_document_id
        : metadata?.source_table === 'site_documents' && typeof metadata?.source_id === 'string'
          ? metadata.source_id
          : null
    const markupDataFromRow =
      Array.isArray(row.markup_data) && row.markup_data.length > 0
        ? row.markup_data
        : Array.isArray(metadata?.markup_data)
          ? metadata.markup_data
          : []
    const linkedIds =
      Array.isArray(metadata?.linked_worklog_ids) && metadata.linked_worklog_ids.length > 0
        ? metadata.linked_worklog_ids.filter(
            (value: unknown): value is string => typeof value === 'string' && value.length > 0
          )
        : metadata?.linked_worklog_id
          ? [metadata.linked_worklog_id]
          : []
    const uploaderName =
      row?.profiles?.full_name ||
      metadata?.uploaded_by_name ||
      metadata?.uploader_name ||
      metadata?.creator_name ||
      null
    const uploaderEmail = row?.profiles?.email || metadata?.uploaded_by_email || null
    return {
      id: `shared-${unifiedDocumentId}`,
      unified_document_id: unifiedDocumentId,
      source: 'shared' as const,
      title: row.title || row.file_name || metadata?.title || '도면',
      description: row.description || metadata?.description || '',
      original_blueprint_url: fileUrl,
      original_blueprint_filename: row.file_name || metadata?.file_name || '도면',
      created_at: row.created_at,
      site_id: row.site_id || metadata?.site_id || null,
      site: row.site
        ? {
            id: row.site.id,
            name: row.site.name || '미지정',
          }
        : null,
      creator:
        uploaderName || uploaderEmail
          ? {
              full_name: uploaderName || uploaderEmail || '작성자 미상',
              email: uploaderEmail,
            }
          : null,
      linked_worklog_id: metadata?.linked_worklog_id || null,
      linked_worklog_ids: linkedIds,
      daily_report: null,
      markup_data: markupDataFromRow,
      linked_markup_document_id: linkedMarkupId || null,
      source_site_document_id: sourceSiteDocId,
    }
  }

  const sharedDocsSystem = sharedRows?.map(row => normalizeSharedDoc(row)).filter(Boolean) || []
  const sharedDocsV2 = sharedRowsV2?.map(row => normalizeSharedDoc(row)).filter(Boolean) || []

  const mergedSharedDocs = (() => {
    const map = new Map<string, any>()
    for (const doc of [...sharedDocsSystem, ...sharedDocsV2]) {
      if (!doc) continue
      const key = doc.unified_document_id || doc.source_site_document_id || doc.id
      map.set(key, doc)
    }
    return Array.from(map.values())
  })()

  const sourceSiteDocIds = new Set(
    mergedSharedDocs
      .map(doc => (doc as any)?.source_site_document_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
  )

  const { data: siteDocRows } = await service
    .from('site_documents')
    .select(
      `
      id,
      site_id,
      document_type,
      file_name,
      file_url,
      file_size,
      mime_type,
      created_at,
      uploaded_by,
      is_active,
      site:sites(id, name)
    `
    )
    .in('document_type', ['blueprint', 'progress_drawing', 'plan', 'ptw'])
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(200)

  const uploaderLookupResolved = new Map<
    string,
    { full_name: string | null; email: string | null }
  >()
  const uploaderIds =
    siteDocRows
      ?.map(row => (typeof row.uploaded_by === 'string' ? row.uploaded_by : null))
      .filter((value): value is string => Boolean(value)) || []
  const uniqueUploaderIds = Array.from(new Set(uploaderIds))
  if (uniqueUploaderIds.length > 0) {
    try {
      const { data: uploaderProfiles } = await service
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uniqueUploaderIds)
      for (const profile of uploaderProfiles || []) {
        if (profile?.id) {
          uploaderLookupResolved.set(profile.id, {
            full_name: profile.full_name || null,
            email: profile.email || null,
          })
        }
      }
    } catch (error) {
      console.warn('Failed to fetch site document uploader profiles:', error)
    }
  }

  const siteDocExtras =
    siteDocRows
      ?.filter(row => {
        if (!row?.file_url) return false
        if (row?.id && sourceSiteDocIds.has(row.id)) return false
        return true
      })
      .map(row => {
        const uploader =
          row?.uploaded_by && uploaderLookupResolved.has(row.uploaded_by)
            ? uploaderLookupResolved.get(row.uploaded_by)
            : null
        return {
          id: `site-${row.id}`,
          unified_document_id: null,
          source_site_document_id: row.id,
          source: 'shared' as const,
          title: row.file_name || '도면',
          description: row.document_type ? `${row.document_type} 업로드 문서` : '',
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
          creator: uploader
            ? {
                full_name: uploader.full_name || uploader.email || '작성자 미상',
                email: uploader.email,
              }
            : null,
          linked_worklog_id: null,
          linked_worklog_ids: [],
          daily_report: null,
          markup_data: [],
          linked_markup_document_id: null,
        }
      })
      .filter(Boolean) || []

  const collectLinkedIds = (doc: any): string[] => {
    const ids = new Set<string>()
    const metadata =
      doc?.metadata && typeof doc.metadata === 'object' ? (doc.metadata as Record<string, any>) : {}
    const pushId = (value?: string | null) => {
      if (typeof value === 'string' && value.trim().length > 0) ids.add(value.trim())
    }
    const listCandidates = [
      doc?.linked_worklog_ids,
      metadata?.linked_worklog_ids,
      doc?.linked_worklogs,
    ]
    listCandidates.forEach(list => {
      if (Array.isArray(list)) {
        list.forEach((value: unknown) => pushId(typeof value === 'string' ? value : null))
      }
    })
    pushId(doc?.linked_worklog_id)
    pushId(metadata?.linked_worklog_id)
    pushId(metadata?.daily_report_id)
    pushId(doc?.daily_report_id)
    return Array.from(ids)
  }

  const allWorklogIds = new Set<string>()
  for (const doc of markupDocs) {
    collectLinkedIds(doc).forEach(id => allWorklogIds.add(id))
  }
  for (const doc of mergedSharedDocs) {
    collectLinkedIds(doc).forEach(id => allWorklogIds.add(id))
  }
  for (const doc of siteDocExtras) {
    collectLinkedIds(doc).forEach(id => allWorklogIds.add(id))
  }

  const worklogMetaMap = (() => {
    if (allWorklogIds.size === 0) return new Map<string, any>()
    return service
      .from('daily_reports')
      .select('id, work_date, component_name, process_type, work_process')
      .in('id', Array.from(allWorklogIds))
      .then(({ data }) => {
        const map = new Map<string, any>()
        for (const row of data || []) {
          if (!row?.id) continue
          map.set(row.id as string, {
            id: row.id,
            work_date: row.work_date || null,
            component_name: row.component_name || null,
            process_type: row.process_type || null,
            work_process: row.work_process || null,
          })
        }
        return map
      })
      .catch(() => new Map<string, any>())
  })()

  const resolvedWorklogMeta = await worklogMetaMap

  const attachWorklogDetails = (doc: any) => {
    const ids = collectLinkedIds(doc)
    const details = ids.map(id => {
      const meta = resolvedWorklogMeta.get(id) || null
      return meta ? { ...meta } : { id }
    })
    return {
      ...doc,
      worklog_details: details,
      linked_worklog_ids: ids,
      daily_report:
        doc?.daily_report && doc.daily_report.work_date
          ? doc.daily_report
          : details[0]
            ? { ...details[0] }
            : doc.daily_report || null,
    }
  }

  const docs = [
    ...markupDocs.map(doc =>
      attachWorklogDetails({
        ...doc,
        source: 'markup' as const,
      })
    ),
    ...mergedSharedDocs.map(doc => attachWorklogDetails(doc)),
    ...siteDocExtras.map(doc => attachWorklogDetails(doc)),
  ].sort((a, b) => {
    const at = new Date(a.created_at || 0).getTime()
    const bt = new Date(b.created_at || 0).getTime()
    return bt - at
  })

  const normalizedSearchParams: ToolPageClientSearchParams = {
    docId: getFirstValue(searchParams?.docId),
    blueprintUrl: getFirstValue(searchParams?.blueprintUrl || searchParams?.blueprint_url),
    siteId: getFirstValue(searchParams?.siteId || searchParams?.site_id),
    title: getFirstValue(searchParams?.title),
    unifiedDocumentId: getFirstValue(
      searchParams?.unifiedDocumentId || searchParams?.unified_document_id
    ),
    markupDocumentId: getFirstValue(
      searchParams?.markupDocumentId || searchParams?.markup_document_id
    ),
    startEmpty: parseBooleanFlag(searchParams?.startEmpty || searchParams?.start_empty),
  }

  return (
    <ToolPageClient docs={docs} siteOptions={siteOptions} initialQuery={normalizedSearchParams} />
  )
}

function getFirstValue(input?: string | string[]): string | undefined {
  if (Array.isArray(input)) return input[0]
  return typeof input === 'string' ? input : undefined
}

function parseBooleanFlag(value?: string | string[]): boolean {
  const resolved = getFirstValue(value)
  if (!resolved) return false
  return resolved === '1' || resolved.toLowerCase() === 'true'
}
