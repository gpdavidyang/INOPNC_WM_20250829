import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { mapSharedSubcategoryToCategory } from '@/lib/unified-documents'

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

    // Customer-manager (partner alias): build allowed site list; if siteId provided but not allowed -> 403
    // If no siteId, aggregate across allowed sites
    let partnerAllowedSiteIds: string[] | null = null
    if (auth.role === 'customer_manager') {
      if (auth.organizationId) {
        const { data: maps } = await supabase
          .from('partner_site_mappings')
          .select('site_id')
          .eq('partner_company_id', auth.organizationId)
          .eq('is_active', true)
        partnerAllowedSiteIds = (maps || []).map((m: any) => m.site_id)
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
        let listQuery = db
          .from('markup_documents')
          .select(
            'id, site_id, title, original_blueprint_url, original_blueprint_filename, created_at'
          )
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .range(0, rangeEnd)

        if (siteId) listQuery = listQuery.eq('site_id', siteId)
        else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
          listQuery = listQuery.in('site_id', partnerAllowedSiteIds)

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
        if (q) {
          countQuery.or(`title.ilike.%${q}%,original_blueprint_filename.ilike.%${q}%`)
        }

        const [{ data }, { count }] = await Promise.all([listQuery, countQuery])
        const mapped =
          data
            ?.filter(row => row?.original_blueprint_url)
            .map(row => ({
              id: `markup-${row.id}`,
              site_id: row.site_id,
              category: 'progress' as const,
              title: row.title || row.original_blueprint_filename || '도면마킹 문서',
              url: row.original_blueprint_url,
              created_at: row.created_at,
            })) || []

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
      sharedRows?.map(row => ({
        id: row.id,
        site_id: row.site_id,
        category: mapSharedSubcategoryToCategory(row.sub_category),
        title: row.title || row.file_name || '도면',
        url: row.file_url,
        size: row.file_size,
        mime: row.mime_type,
        created_at: row.created_at,
      })) || []

    let countQuery = db
      .from('unified_document_system')
      .select('id', { count: 'exact', head: true })
      .eq('category_type', 'shared')
      .eq('status', 'active')
      .eq('is_archived', false)

    if (siteId) countQuery = countQuery.eq('site_id', siteId)
    else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
      countQuery = countQuery.in('site_id', partnerAllowedSiteIds)
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
