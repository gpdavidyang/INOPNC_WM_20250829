import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type LinkedDrawingRecord = {
  id: string
  title: string
  url: string
  originalUrl?: string | null
  previewUrl?: string | null
  siteId?: string | null
  source: 'markup' | 'shared'
  markupId?: string
  createdAt?: string | null
  linkedWorklogIds?: string[]
  documentType?: string | null
  uploaderName?: string | null
  uploaderEmail?: string | null
  uploader?: {
    full_name?: string | null
    email?: string | null
    role?: string | null
  } | null
  markupData?: any[]
}

const isUuid = (value?: string | null) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function fetchLinkedDrawingsForWorklog(
  worklogId: string,
  siteId?: string | null
): Promise<LinkedDrawingRecord[]> {
  if (!worklogId) return []
  const svc = createServiceRoleClient()
  const [markupRes, linkRes, sharedRes, worklogRes] = await Promise.all([
    svc
      .from('markup_documents')
      .select(
        `
        id,
        title,
        preview_image_url,
        original_blueprint_url,
        original_blueprint_filename,
        site_id,
        created_at,
        linked_worklog_id,
        created_by,
        creator:profiles!markup_documents_created_by_fkey (
          full_name,
          email,
          role
          email,
          role
        ),
        markup_data
      `
      )
      .eq('is_deleted', false),
    svc
      .from('markup_document_worklog_links')
      .select('markup_document_id')
      .eq('worklog_id', worklogId),
    svc
      .from('unified_document_system')
      .select(
        'id, title, file_url, file_name, site_id, created_at, metadata, sub_category, uploaded_by, uploader:profiles!unified_document_system_uploaded_by_fkey(full_name, email, role)'
      )
      .eq('category_type', 'shared')
      .eq('status', 'active')
      .eq('is_archived', false),
    svc
      .from('daily_reports')
      .select('id, work_date, work_description')
      .eq('id', worklogId)
      .maybeSingle(),
  ])

  const linkedIds = new Set<string>(
    (linkRes.data || [])
      .map(row => (typeof row?.markup_document_id === 'string' ? row.markup_document_id : null))
      .filter((id): id is string => Boolean(id))
  )

  const markupIds =
    markupRes.data
      ?.map(row => (typeof row?.id === 'string' ? row.id : null))
      .filter((id): id is string => Boolean(id)) || []
  const worklogMap =
    markupIds.length > 0 ? await fetchMarkupWorklogMap(markupIds) : new Map<string, string[]>()

  const markupRecords =
    markupRes.data
      ?.filter(row => {
        const direct = row?.linked_worklog_id === worklogId
        const viaLink = linkedIds.has(row.id)
        return row?.original_blueprint_url && (direct || viaLink)
      })
      .map(row => {
        const extras = row?.id ? worklogMap.get(row.id) || [] : []
        const combined = row?.linked_worklog_id
          ? [row.linked_worklog_id as string, ...extras]
          : extras
        const linkedWorklogIds = Array.from(
          new Set(
            combined.filter(
              (value): value is string => typeof value === 'string' && value.trim().length > 0
            )
          )
        )
        return {
          id: row.id,
          title: row.title || row.original_blueprint_filename || '도면마킹 문서',
          url: row.original_blueprint_url,
          originalUrl: row.original_blueprint_url,
          previewUrl: row.preview_image_url,
          siteId: row.site_id,
          source: 'markup' as const,
          markupId: row.id,
          createdAt: row.created_at,
          linkedWorklogIds,
          documentType: 'progress_drawing',
          uploaderName:
            ((row as any).creator || (row as any).uploader || (row as any).profiles)?.full_name ||
            null,
          uploaderEmail:
            ((row as any).creator || (row as any).uploader || (row as any).profiles)?.email || null,
          uploader: (row as any).creator || (row as any).uploader || (row as any).profiles,
          markupData: row.markup_data,
        }
      }) || []

  const sharedRecords =
    sharedRes.data
      ?.map(row => {
        const metadata =
          row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, any>)
            : {}
        const linkedPrimary =
          typeof metadata.linked_worklog_id === 'string' ? metadata.linked_worklog_id : null
        const linkedArray: string[] = Array.isArray(metadata.linked_worklog_ids)
          ? metadata.linked_worklog_ids.filter((v: any) => typeof v === 'string')
          : []
        const matches =
          linkedPrimary === worklogId ||
          metadata.daily_report_id === worklogId ||
          linkedArray.includes(worklogId)
        if (!matches) return null
        const previewUrl =
          typeof metadata.preview_image_url === 'string' && metadata.preview_image_url.length > 0
            ? metadata.preview_image_url
            : typeof metadata.snapshot_url === 'string' && metadata.snapshot_url.length > 0
              ? metadata.snapshot_url
              : null
        const combinedLinkedIds =
          linkedPrimary && !linkedArray.includes(linkedPrimary)
            ? [linkedPrimary, ...linkedArray]
            : linkedArray
        const extendedIds =
          typeof metadata.daily_report_id === 'string' &&
          metadata.daily_report_id.length > 0 &&
          !combinedLinkedIds.includes(metadata.daily_report_id)
            ? [metadata.daily_report_id, ...combinedLinkedIds]
            : combinedLinkedIds
        const worklogSummary = worklogRes.data || null
        return {
          id: row.id,
          title: row.title || row.file_name || '도면',
          url: row.file_url,
          originalUrl: metadata.original_blueprint_url || row.file_url,
          previewUrl,
          siteId: row.site_id,
          source: 'shared' as const,
          markupId:
            typeof metadata.source_table === 'string' &&
            metadata.source_table === 'markup_documents'
              ? metadata.markup_document_id || metadata.source_id
              : undefined,
          createdAt: row.created_at,
          linkedWorklogIds: extendedIds,
          worklogDate: worklogSummary?.work_date || null,
          worklogDescription: worklogSummary?.work_description || null,
          documentType: row.sub_category || metadata.document_type || metadata.documentType,
          uploaderName: (row.profiles as any)?.full_name || null,
          uploaderEmail: (row.profiles as any)?.email || null,
          uploader: row.profiles as any,
        }
      })
      .filter(Boolean) || []

  const results = [...markupRecords, ...sharedRecords]

  // Deduplicate results by markupId or ID
  const dedupedMap = new Map<string, LinkedDrawingRecord>()

  // First pass: add all records
  results.forEach(rec => {
    if (!rec) return
    // Treat mirrored markups as the same item using markupId
    const key = rec.markupId || rec.id
    const existing = dedupedMap.get(key)

    const isSharedProgress =
      rec.source === 'shared' &&
      (rec.documentType === 'progress_drawing' || rec.documentType === 'progress')
    const existingIsSharedProgress =
      existing?.source === 'shared' &&
      (existing.documentType === 'progress_drawing' || existing.documentType === 'progress')

    // Prefer shared progress drawing over markup record (avoids showing both)
    if (existing && existing.source === 'markup' && isSharedProgress) {
      dedupedMap.set(key, rec)
      return
    }

    // Prefer markup source over shared (mirrored) source for non-progress items
    if (
      !existing ||
      (!existingIsSharedProgress && existing.source === 'shared' && rec.source === 'markup')
    ) {
      dedupedMap.set(key, rec)
    }
  })

  const resultsDeduped = Array.from(dedupedMap.values())

  if (siteId) {
    resultsDeduped.sort((a, b) => {
      if (a.siteId === siteId && b.siteId !== siteId) return -1
      if (a.siteId !== siteId && b.siteId === siteId) return 1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }
  return resultsDeduped
}

export async function syncMarkupWorklogLinks(markupId: string, worklogIds: string[]) {
  if (!isUuid(markupId)) return
  const svc = createServiceRoleClient()
  const unique = Array.from(new Set(worklogIds.filter(id => isUuid(id))))
  const { data: existing } = await svc
    .from('markup_document_worklog_links')
    .select('worklog_id')
    .eq('markup_document_id', markupId)
  const existingIds = new Set(
    (existing || [])
      .map(row => (typeof row?.worklog_id === 'string' ? row.worklog_id : null))
      .filter((id): id is string => Boolean(id))
  )
  const toInsert = unique
    .filter(id => !existingIds.has(id))
    .map(id => ({ markup_document_id: markupId, worklog_id: id }))
  const toDelete = Array.from(existingIds).filter(id => !unique.includes(id))
  if (toInsert.length > 0) {
    const { error } = await svc.from('markup_document_worklog_links').insert(toInsert)
    if (error) console.error('Error inserting links:', error)
  }
  if (toDelete.length > 0) {
    const { error } = await svc
      .from('markup_document_worklog_links')
      .delete()
      .eq('markup_document_id', markupId)
      .in('worklog_id', toDelete)
    if (error) console.error('Error deleting links:', error)
  }
  const primary = unique[0] ?? null
  await svc
    .from('markup_documents')
    .update({ linked_worklog_id: primary })
    .eq('id', markupId)
    .catch(() => null)
}

export async function fetchMarkupWorklogMap(markupIds: string[]) {
  const map = new Map<string, string[]>()
  const svc = createServiceRoleClient()
  const unique = Array.from(new Set(markupIds.filter(id => isUuid(id))))
  if (unique.length === 0) return map

  const { data } = await svc
    .from('markup_document_worklog_links')
    .select('markup_document_id, worklog_id')
    .in('markup_document_id', unique)

  ;(data || []).forEach(row => {
    const markupId = typeof row?.markup_document_id === 'string' ? row.markup_document_id : null
    const worklogId = typeof row?.worklog_id === 'string' ? row.worklog_id : null
    if (!markupId || !worklogId) return
    if (!map.has(markupId)) map.set(markupId, [])
    const list = map.get(markupId)!
    if (!list.includes(worklogId)) list.push(worklogId)
  })

  return map
}

/**
 * PostgREST JSONB Filter Builder for finding shared documents linked to a worklog.
 * This handles the complexity of inconsistent JSON keys in the unified_document_system table:
 * - linked_worklog_id (string)
 * - linked_worklog_ids (array)
 * - daily_report_id (legacy string)
 * - worklog_id (legacy string)
 *
 * Use this to avoid manual string concatenation errors in route handlers.
 *
 * @param worklogId - UUID of the worklog
 * @param column - PostgREST column name (default: "metadata")
 * @returns A comma-separated OR condition string for PostgREST
 */
export function buildWorklogMetadataFilter(worklogId: string, column = 'metadata'): string {
  if (!isUuid(worklogId))
    return `${column}->>linked_worklog_id.eq.00000000-0000-0000-0000-000000000000` // fail safe

  // Note: for 'cs' (contains) on a JSONB array, we must use `["value"]` string format.
  // PostgREST/Postgres needs the right-hand side to be a valid JSON representation of the contained element (or array).
  // e.g. metadata->linked_worklog_ids.cs.["uuid"]
  const conditions = [
    `${column}->>linked_worklog_id.eq.${worklogId}`,
    `${column}->linked_worklog_ids.cs.["${worklogId}"]`,
    `${column}->>daily_report_id.eq.${worklogId}`,
    `${column}->>worklog_id.eq.${worklogId}`,
  ]

  return conditions.join(',')
}
