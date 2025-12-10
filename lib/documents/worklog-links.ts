import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type LinkedDrawingRecord = {
  id: string
  title: string
  url: string
  previewUrl?: string | null
  siteId?: string | null
  source: 'markup' | 'shared'
  markupId?: string
  createdAt?: string | null
  linkedWorklogIds?: string[]
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
        linked_worklog_id
      `
      )
      .eq('is_deleted', false),
    svc
      .from('markup_document_worklog_links')
      .select('markup_document_id')
      .eq('worklog_id', worklogId),
    svc
      .from('unified_document_system')
      .select('id, title, file_url, file_name, site_id, created_at, metadata')
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
          previewUrl: row.preview_image_url,
          siteId: row.site_id,
          source: 'markup' as const,
          markupId: row.id,
          createdAt: row.created_at,
          linkedWorklogIds,
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
        }
      })
      .filter(Boolean) || []

  const results = [...markupRecords, ...sharedRecords]
  if (siteId) {
    results.sort((a, b) => {
      if (a.siteId === siteId && b.siteId !== siteId) return -1
      if (a.siteId !== siteId && b.siteId === siteId) return 1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }
  return results
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
    await svc
      .from('markup_document_worklog_links')
      .insert(toInsert)
      .catch(() => null)
  }
  if (toDelete.length > 0) {
    await svc
      .from('markup_document_worklog_links')
      .delete()
      .eq('markup_document_id', markupId)
      .in('worklog_id', toDelete)
      .catch(() => null)
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
