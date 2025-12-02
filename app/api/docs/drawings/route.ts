import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { mapSharedSubcategoryToCategory } from '@/lib/unified-documents'
import { fetchMarkupWorklogMap } from '@/lib/documents/worklog-links'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    // Prefer service-role if configured; otherwise, fall back to session client
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
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const q = (searchParams.get('q') || '').trim()
    const worklogId = (searchParams.get('worklogId') || searchParams.get('worklog_id') || '').trim()

    // Customer-manager (partner alias): build allowed site list; if siteId provided but not allowed -> 403
    // If no siteId, aggregate across allowed sites
    let partnerAllowedSiteIds: string[] | null = null
    if (auth.role === 'customer_manager') {
      const partnerCompanyId =
        auth.restrictedOrgId ||
        (auth as any).organizationId ||
        (auth as any).partnerCompanyId ||
        null

      if (partnerCompanyId) {
        const { data: maps, error: mapError } = await supabase
          .from('partner_site_mappings')
          .select('site_id')
          .eq('partner_company_id', partnerCompanyId)
          .eq('is_active', true)

        const mappedIds =
          !mapError && Array.isArray(maps)
            ? maps
                .map(row =>
                  typeof (row as any)?.site_id === 'string' ? (row as any).site_id : null
                )
                .filter((id): id is string => Boolean(id))
            : []

        if (mappedIds.length > 0) {
          partnerAllowedSiteIds = Array.from(new Set(mappedIds))
        } else {
          const { data: legacyRows, error: legacyError } = await supabase
            .from('site_partners')
            .select('site_id')
            .eq('partner_company_id', partnerCompanyId)

          partnerAllowedSiteIds =
            !legacyError && Array.isArray(legacyRows)
              ? legacyRows
                  .map(row =>
                    typeof (row as any)?.site_id === 'string' ? (row as any).site_id : null
                  )
                  .filter((id): id is string => Boolean(id))
              : []
        }
      } else {
        partnerAllowedSiteIds = []
      }

      if (siteId) {
        const ok = (partnerAllowedSiteIds || []).includes(siteId)
        if (!ok) {
          return NextResponse.json(
            { success: false, error: 'Access denied to this site' },
            { status: 403 }
          )
        }
      } else if ((partnerAllowedSiteIds || []).length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    const rangeEnd = Math.max(Math.min(to + 1, 500) - 1, 0)
    const includeMarkup = !category || category === 'progress'

    const mergeAndRespond = async (baseItems: any[], baseCount: number): Promise<NextResponse> => {
      let merged = [...baseItems]
      let total = baseCount

      if (includeMarkup) {
        const { items: markupItems, count: markupCount } = await fetchMarkupBundle()
        merged = merged.concat(markupItems)
        total += markupCount
      }

      merged.sort((a, b) => {
        const at = new Date(a.created_at || 0).getTime()
        const bt = new Date(b.created_at || 0).getTime()
        return bt - at
      })

      const paged = merged.slice(from, from + limit)

      return NextResponse.json({
        success: true,
        data: paged,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    let markupCache: { items: any[]; count: number } | null = null
    const fetchMarkupBundle = async () => {
      if (!includeMarkup) return { items: [], count: 0 }
      if (markupCache) return markupCache

      try {
        let linkedMarkupDocIds: string[] = []
        if (worklogId) {
          const { data: linkRows } = await db
            .from('markup_document_worklog_links')
            .select('markup_document_id')
            .eq('worklog_id', worklogId)
          linkedMarkupDocIds =
            linkRows
              ?.map(row =>
                typeof row?.markup_document_id === 'string' ? row.markup_document_id : null
              )
              .filter((id): id is string => Boolean(id)) || []
        }

        let listQuery = db
          .from('markup_documents')
          .select(
            'id, site_id, title, original_blueprint_url, original_blueprint_filename, created_at, preview_image_url, linked_worklog_id'
          )
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .range(0, rangeEnd)

        if (siteId) listQuery = listQuery.eq('site_id', siteId)
        else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
          listQuery = listQuery.in('site_id', partnerAllowedSiteIds)
        if (worklogId) {
          if (linkedMarkupDocIds.length > 0) {
            const inList = linkedMarkupDocIds.map(id => `"${id}"`).join(',')
            listQuery = listQuery.or(`linked_worklog_id.eq.${worklogId},id.in.(${inList})`)
          } else {
            listQuery = listQuery.eq('linked_worklog_id', worklogId)
          }
        }

        if (q) {
          listQuery = listQuery.or(`title.ilike.%${q}%,original_blueprint_filename.ilike.%${q}%`)
        }

        const countQuery = db
          .from('markup_documents')
          .select('id', { count: 'exact', head: true })
          .eq('is_deleted', false)

        if (siteId) countQuery.eq('site_id', siteId)
        else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
          countQuery.in('site_id', partnerAllowedSiteIds)
        if (worklogId) {
          if (linkedMarkupDocIds.length > 0) {
            const inList = linkedMarkupDocIds.map(id => `"${id}"`).join(',')
            countQuery.or(`linked_worklog_id.eq.${worklogId},id.in.(${inList})`)
          } else {
            countQuery.eq('linked_worklog_id', worklogId)
          }
        }
        if (q) {
          countQuery.or(`title.ilike.%${q}%,original_blueprint_filename.ilike.%${q}%`)
        }

        const [{ data }, { count }] = await Promise.all([listQuery, countQuery])
        const markupIds =
          data
            ?.map(row => (typeof row?.id === 'string' ? row.id : null))
            .filter((id): id is string => Boolean(id)) || []
        const linkMap =
          markupIds.length > 0
            ? await fetchMarkupWorklogMap(markupIds)
            : new Map<string, string[]>()
        const mapped =
          data
            ?.filter(row => row?.original_blueprint_url)
            .map(row => {
              const previewUrl =
                typeof row.preview_image_url === 'string' && row.preview_image_url.length > 0
                  ? row.preview_image_url
                  : null
              const extras = row?.id ? linkMap.get(row.id) || [] : []
              const combined = row?.linked_worklog_id
                ? [row.linked_worklog_id as string, ...extras]
                : extras
              const linkedIds = Array.from(new Set(combined))
              const primaryUrl = previewUrl || row.original_blueprint_url
              return {
                id: `markup-${row.id}`,
                site_id: row.site_id,
                category: 'progress' as const,
                title: row.title || row.original_blueprint_filename || '도면마킹 문서',
                url: primaryUrl,
                preview_url: previewUrl,
                created_at: row.created_at,
                linked_worklog_id: row.linked_worklog_id,
                linked_worklog_ids: linkedIds,
              }
            }) || []

        markupCache = { items: mapped, count: count || 0 }
        return markupCache
      } catch {
        return { items: [], count: 0 }
      }
    }

    const planSubcategories = ['construction_drawing', 'blueprint', 'plan']
    const progressSubcategories = ['progress_drawing', 'progress']

    let sharedQuery = db
      .from('unified_document_system')
      .select(
        'id, site_id, title, file_name, file_url, file_size, mime_type, created_at, sub_category, metadata, status, is_archived'
      )
      .eq('category_type', 'shared')
      .eq('status', 'active')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (siteId) sharedQuery = sharedQuery.eq('site_id', siteId)
    else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
      sharedQuery = sharedQuery.in('site_id', partnerAllowedSiteIds)
    if (worklogId) {
      const sharedFilter = `metadata->>linked_worklog_id.eq.${worklogId},metadata->linked_worklog_ids.cs.{"${worklogId}"}`
      sharedQuery = sharedQuery.or(sharedFilter)
    }

    if (category === 'plan') sharedQuery = sharedQuery.in('sub_category', planSubcategories)
    else if (category === 'progress')
      sharedQuery = sharedQuery.in('sub_category', progressSubcategories)
    else if (category === 'other')
      sharedQuery = sharedQuery.not(
        'sub_category',
        'in',
        '("construction_drawing","blueprint","plan","progress_drawing","progress","ptw")'
      )

    if (q) {
      const like = `%${q}%`
      sharedQuery = sharedQuery.or(`title.ilike.${like},file_name.ilike.${like}`)
    }

    const { data: sharedRows, error: sharedError } = await sharedQuery.range(0, rangeEnd)
    if (sharedError) {
      console.error('[docs/drawings] failed to load shared documents', sharedError)
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const baseItems =
      sharedRows?.map(row => {
        const metadata =
          row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, any>)
            : {}
        const storagePath =
          typeof metadata.storage_path === 'string' && metadata.storage_path.length > 0
            ? metadata.storage_path
            : typeof metadata.storagePath === 'string' && metadata.storagePath.length > 0
              ? metadata.storagePath
              : null
        const storageBucket =
          typeof metadata.storage_bucket === 'string' && metadata.storage_bucket.length > 0
            ? metadata.storage_bucket
            : typeof metadata.storageBucket === 'string' && metadata.storageBucket.length > 0
              ? metadata.storageBucket
              : null
        const previewUrl =
          typeof metadata.preview_image_url === 'string' && metadata.preview_image_url.length > 0
            ? metadata.preview_image_url
            : typeof metadata.previewUrl === 'string' && metadata.previewUrl.length > 0
              ? metadata.previewUrl
              : null
        const linkedWorklogId =
          typeof metadata.linked_worklog_id === 'string' && metadata.linked_worklog_id.length > 0
            ? metadata.linked_worklog_id
            : typeof metadata.daily_report_id === 'string' && metadata.daily_report_id.length > 0
              ? metadata.daily_report_id
              : null
        const linkedWorklogIds = Array.isArray(metadata.linked_worklog_ids)
          ? metadata.linked_worklog_ids.filter(
              (id: unknown): id is string => typeof id === 'string'
            )
          : []
        const combinedLinkedIds =
          linkedWorklogId && !linkedWorklogIds.includes(linkedWorklogId)
            ? [linkedWorklogId, ...linkedWorklogIds]
            : linkedWorklogIds
        return {
          id: row.id,
          site_id: row.site_id,
          category: mapSharedSubcategoryToCategory(row.sub_category),
          title: row.title || row.file_name || '도면',
          url: row.file_url,
          preview_url: previewUrl,
          size: row.file_size,
          mime: row.mime_type,
          created_at: row.created_at,
          storage_path: storagePath,
          storage_bucket: storageBucket,
          linked_worklog_id: linkedWorklogId,
          linked_worklog_ids: combinedLinkedIds,
          metadata,
        }
      }) || []

    let countQuery = db
      .from('unified_document_system')
      .select('id', { count: 'exact', head: true })
      .eq('category_type', 'shared')
      .eq('status', 'active')
      .eq('is_archived', false)

    if (siteId) countQuery = countQuery.eq('site_id', siteId)
    else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
      countQuery = countQuery.in('site_id', partnerAllowedSiteIds)
    if (worklogId) {
      const sharedFilter = `metadata->>linked_worklog_id.eq.${worklogId},metadata->linked_worklog_ids.cs.{"${worklogId}"}`
      countQuery = countQuery.or(sharedFilter)
    }
    if (category === 'plan') countQuery = countQuery.in('sub_category', planSubcategories)
    else if (category === 'progress')
      countQuery = countQuery.in('sub_category', progressSubcategories)
    else if (category === 'other')
      countQuery = countQuery.not(
        'sub_category',
        'in',
        '("construction_drawing","blueprint","plan","progress_drawing","progress","ptw")'
      )
    if (q) {
      const like = `%${q}%`
      countQuery = countQuery.or(`title.ilike.${like},file_name.ilike.${like}`)
    }

    const { count } = await countQuery

    return mergeAndRespond(baseItems, count || 0)
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
