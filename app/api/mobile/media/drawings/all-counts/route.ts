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
    const reportIds = searchParams.getAll('worklog_id')

    // Fallback for CSV format
    const csv = searchParams.get('worklog_ids') || searchParams.get('worklogIds')
    if (csv) {
      csv.split(',').forEach(id => {
        const t = id.trim()
        if (isUuid(t) && !reportIds.includes(t)) reportIds.push(t)
      })
    }

    if (reportIds.length === 0) {
      return NextResponse.json({ success: true, data: {} })
    }

    // Initialize counts
    const counts: Record<string, number> = {}
    reportIds.forEach(id => {
      counts[id] = 0
    })

    // Fetch Markup Documents and their links for these worklogs
    const [markupDocs, markupLinks, udsDocs] = await Promise.all([
      svc
        .from('markup_documents')
        .select('id, site_id, linked_worklog_id, original_blueprint_url')
        .eq('is_deleted', false),
      svc
        .from('markup_document_worklog_links')
        .select('worklog_id, markup_document_id')
        .in('worklog_id', reportIds),
      svc
        .from('unified_document_system')
        .select('id, metadata')
        .eq('category_type', 'shared')
        .eq('status', 'active')
        .eq('is_archived', false)
        .eq('site_id', siteId),
    ])

    const validMarkupIds = new Set<string>(
      markupDocs.data?.filter(d => d.original_blueprint_url).map(d => d.id) || []
    )

    const worklogToItems = new Map<string, Set<string>>()
    const ensureSet = (wId: string) => {
      if (!worklogToItems.has(wId)) worklogToItems.set(wId, new Set())
      return worklogToItems.get(wId)!
    }

    // 1. Direct links in markup_documents
    markupDocs.data?.forEach(doc => {
      if (
        doc.linked_worklog_id &&
        reportIds.includes(doc.linked_worklog_id) &&
        validMarkupIds.has(doc.id)
      ) {
        ensureSet(doc.linked_worklog_id).add(doc.id)
      }
    })

    // 2. Mapping table links
    markupLinks.data?.forEach(link => {
      if (validMarkupIds.has(link.markup_document_id)) {
        ensureSet(link.worklog_id).add(link.markup_document_id)
      }
    })

    // 3. UDS Items
    udsDocs.data?.forEach(doc => {
      const meta = (doc.metadata as any) || {}
      const isMirroredMarkup = meta.source_table === 'markup_documents'
      const mId = meta.markup_document_id || meta.source_id
      const effectiveId = isMirroredMarkup && mId && validMarkupIds.has(mId) ? mId : doc.id

      // Extract all linked worklog IDs from metadata
      const linkedIds = new Set<string>()
      if (isUuid(meta.linked_worklog_id)) linkedIds.add(meta.linked_worklog_id)
      if (isUuid(meta.daily_report_id)) linkedIds.add(meta.daily_report_id)
      if (isUuid(meta.worklog_id)) linkedIds.add(meta.worklog_id)
      if (Array.isArray(meta.linked_worklog_ids)) {
        meta.linked_worklog_ids.forEach((id: any) => {
          if (isUuid(String(id))) linkedIds.add(String(id))
        })
      }

      linkedIds.forEach(wId => {
        if (reportIds.includes(wId)) {
          ensureSet(wId).add(effectiveId)
        }
      })
    })

    worklogToItems.forEach((items, wId) => {
      counts[wId] = items.size
    })

    return NextResponse.json({ success: true, data: counts })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
