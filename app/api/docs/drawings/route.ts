import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { buildWorklogMetadataFilter } from '@/lib/documents/worklog-links'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { mapSharedSubcategoryToCategory } from '@/lib/unified-documents'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isUuid = (value?: string | null) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    const canUseService = Boolean(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SERVICE_KEY ||
          process.env.SUPABASE_SERVICE_ROLE)
    )
    const db = canUseService ? createServiceClient() : supabase
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId') || undefined
    const category =
      (searchParams.get('category') as 'plan' | 'progress' | 'other' | null) || undefined
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '100')))
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const q = (searchParams.get('q') || '').trim()
    const worklogId = (searchParams.get('worklogId') || searchParams.get('worklog_id') || '').trim()

    // 1. Fetch Markup Links first to know which markups to include
    let linkedMarkupDocIds: string[] = []
    if (worklogId && isUuid(worklogId)) {
      const { data: linkRows } = await db
        .from('markup_document_worklog_links')
        .select('markup_document_id')
        .eq('worklog_id', worklogId)
      linkedMarkupDocIds =
        linkRows?.map(r => r.markup_document_id).filter(id => id && isUuid(id)) || []
    }

    // 2. Build Markup Query
    let markupDocsQuery = db
      .from('markup_documents')
      .select(
        'id, site_id, title, original_blueprint_url, original_blueprint_filename, created_at, preview_image_url, linked_worklog_id, markup_data'
      )
      .eq('is_deleted', false)
      .limit(200) // Increased limit for merging

    if (siteId) markupDocsQuery = markupDocsQuery.eq('site_id', siteId)
    if (worklogId && isUuid(worklogId)) {
      if (linkedMarkupDocIds.length > 0) {
        const idsCsv = linkedMarkupDocIds.map(id => `"${id}"`).join(',')
        markupDocsQuery = markupDocsQuery.or(`linked_worklog_id.eq.${worklogId},id.in.(${idsCsv})`)
      } else {
        markupDocsQuery = markupDocsQuery.eq('linked_worklog_id', worklogId)
      }
    }

    // 3. Build UDS Query
    let udsQuery = db
      .from('unified_document_system')
      .select('*')
      .eq('category_type', 'shared')
      .eq('status', 'active')
      .eq('is_archived', false)
      .limit(200)

    if (siteId) udsQuery = udsQuery.eq('site_id', siteId)
    if (worklogId && isUuid(worklogId))
      udsQuery = udsQuery.or(buildWorklogMetadataFilter(worklogId))

    const [markupRes, udsRes] = await Promise.all([markupDocsQuery, udsQuery])

    const markupItems =
      markupRes.data
        ?.filter(d => d.original_blueprint_url)
        .map(row => ({
          id: `markup-${row.id}`,
          markup_document_id: row.id,
          site_id: row.site_id,
          category: 'progress',
          title: row.title || row.original_blueprint_filename || '도면마킹 문서',
          url: row.preview_image_url || row.original_blueprint_url,
          preview_url: row.preview_image_url,
          created_at: row.created_at,
          linked_worklog_id: row.linked_worklog_id,
          markup_data: row.markup_data,
          original_blueprint_url: row.original_blueprint_url,
          original_blueprint_filename: row.original_blueprint_filename,
        })) || []

    const baseItems =
      udsRes.data?.map(row => {
        const metadata = row.metadata || {}
        return {
          id: row.id,
          markup_document_id:
            metadata.source_table === 'markup_documents'
              ? metadata.markup_document_id || metadata.source_id
              : undefined,
          site_id: row.site_id,
          category: mapSharedSubcategoryToCategory(row.sub_category),
          title: row.title || row.file_name || '도면',
          url: row.file_url,
          preview_url: metadata.preview_image_url || metadata.snapshot_url,
          size: row.file_size,
          mime: row.mime_type,
          created_at: row.created_at,
          linked_worklog_id: metadata.linked_worklog_id || metadata.daily_report_id,
          metadata,
        }
      }) || []

    const merged = [...markupItems, ...baseItems]

    // Deduplicate: If an item exists as both a markup_document and a shared UDS entry (mirrored),
    // prefer the markup_document for editing precision.
    const dedupedMap = new Map<string, any>()
    merged.forEach(item => {
      const realMarkupId =
        item.markup_document_id ||
        (item.id.startsWith('markup-') ? item.id.replace('markup-', '') : null)
      if (realMarkupId) {
        const existing = dedupedMap.get(realMarkupId)
        // Prefer the item with markup_data
        if (!existing || (item.markup_data && !existing.markup_data)) {
          dedupedMap.set(realMarkupId, item)
        }
      } else {
        dedupedMap.set(item.id, item)
      }
    })

    let finalData = Array.from(dedupedMap.values())

    // Filter by search query if any
    if (q) {
      const lowerQ = q.toLowerCase()
      finalData = finalData.filter(
        item =>
          (item.title || '').toLowerCase().includes(lowerQ) ||
          (item.original_blueprint_filename || '').toLowerCase().includes(lowerQ)
      )
    }

    // Filter by category if any
    if (category) {
      finalData = finalData.filter(item => item.category === category)
    }

    finalData.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    const from = (page - 1) * limit
    const paged = finalData.slice(from, from + limit)

    return NextResponse.json({
      success: true,
      data: paged,
      pagination: {
        page,
        limit,
        total: finalData.length,
        totalPages: Math.ceil(finalData.length / limit),
      },
    })
  } catch (e: any) {
    console.error('[docs/drawings] GET error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
