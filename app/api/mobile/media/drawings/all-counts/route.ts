import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isUuid = (value?: string | null) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const svc = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const filterWorklogIds = (() => {
      const ids = new Set<string>()
      const repeated = searchParams.getAll('worklog_id')
      repeated.forEach(v => {
        const t = (v || '').trim()
        if (isUuid(t)) ids.add(t)
      })

      const csv =
        searchParams.get('worklog_ids') ||
        searchParams.get('worklogIds') ||
        searchParams.get('worklogId')
      if (csv) {
        csv
          .split(',')
          .map(v => v.trim())
          .forEach(v => {
            if (isUuid(v)) ids.add(v)
          })
      }

      return ids.size > 0 ? ids : null
    })()

    // 1. Fetch all valid non-deleted markups to know which ones have original_blueprint_url
    let markupDocsQuery = svc
      .from('markup_documents')
      .select('id, linked_worklog_id, original_blueprint_url')
      .eq('is_deleted', false)

    // 2. Fetch all markup links
    let markupLinksQuery = svc
      .from('markup_document_worklog_links')
      .select('worklog_id, markup_document_id')

    // 3. Fetch UDS links
    let udsQuery = svc
      .from('unified_document_system')
      .select('id, metadata')
      .eq('category_type', 'shared')
      .eq('status', 'active')
      .eq('is_archived', false)

    if (siteId && siteId !== 'all') {
      markupDocsQuery = markupDocsQuery.eq('site_id', siteId)
      udsQuery = udsQuery.eq('site_id', siteId)
    }

    const [markupDocs, markupLinks, udsLinks] = await Promise.all([
      markupDocsQuery,
      markupLinksQuery,
      udsQuery,
    ])

    const validMarkupIds = new Set<string>()
    const markupIdToDirectWorklog = new Map<string, string>()

    markupDocs.data?.forEach(doc => {
      // Sync logic: fetchLinkedDrawingsForWorklog filters by original_blueprint_url
      if (doc.original_blueprint_url) {
        validMarkupIds.add(doc.id)
        if (doc.linked_worklog_id) {
          markupIdToDirectWorklog.set(doc.id, doc.linked_worklog_id)
        }
      }
    })

    const worklogToDrawings = new Map<string, Set<string>>()

    const addUniqueLink = (worklogId: any, drawingId: string) => {
      if (!worklogId || !drawingId) return
      const wKey = String(worklogId)
      if (filterWorklogIds && !filterWorklogIds.has(wKey)) return
      if (!worklogToDrawings.has(wKey)) {
        worklogToDrawings.set(wKey, new Set())
      }
      worklogToDrawings.get(wKey)!.add(drawingId)
    }

    // Process valid markups (direct links)
    validMarkupIds.forEach(mId => {
      const wId = markupIdToDirectWorklog.get(mId)
      if (wId) addUniqueLink(wId, mId)
    })

    // Process valid markup links (mapping table)
    markupLinks.data?.forEach(link => {
      if (validMarkupIds.has(link.markup_document_id)) {
        addUniqueLink(link.worklog_id, link.markup_document_id)
      }
    })

    // Process UDS (which may include mirrored markups)
    udsLinks.data?.forEach(doc => {
      const meta = (doc.metadata as any) || {}

      // If it's a mirrored markup, use the markup ID so we don't count it twice
      const isMirroredMarkup = meta.source_table === 'markup_documents'
      const markupId = meta.markup_document_id || meta.source_id

      // Sync logic: Only count if it's not a markup link or if it's a VALID markup link
      if (isMirroredMarkup && markupId) {
        if (!validMarkupIds.has(markupId)) return // Skip invalid/deleted mirrored markups
      }

      const effectiveDrawingId = isMirroredMarkup && markupId ? markupId : doc.id

      if (meta.linked_worklog_id) addUniqueLink(meta.linked_worklog_id, effectiveDrawingId)
      if (Array.isArray(meta.linked_worklog_ids)) {
        meta.linked_worklog_ids.forEach((wId: any) => addUniqueLink(wId, effectiveDrawingId))
      }
      if (meta.daily_report_id) addUniqueLink(meta.daily_report_id, effectiveDrawingId)
    })

    const counts: Record<string, number> = {}
    worklogToDrawings.forEach((drawingSet, wId) => {
      counts[wId] = drawingSet.size
    })

    return NextResponse.json({ success: true, data: counts })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
