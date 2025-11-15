import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

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

    // Primary: site_documents
    try {
      let query = db
        .from('site_documents')
        .select('id, site_id, document_type, file_name, file_url, file_size, mime_type, created_at')
        .order('created_at', { ascending: false })

      if (siteId) query = query.eq('site_id', siteId)
      else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
        query = query.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') query = query.eq('document_type', 'blueprint')
      if (category === 'progress') query = query.eq('document_type', 'progress_drawing')
      if (category === 'other') query = query.eq('document_type', 'other')
      if (q) query = query.ilike('file_name', `%${q}%`)

      const { data, error } = await query.range(0, rangeEnd)
      if (error) throw error

      const baseItems = (data || []).map((d: any) => ({
        id: d.id,
        site_id: d.site_id,
        category:
          d.document_type === 'blueprint'
            ? 'plan'
            : d.document_type === 'progress_drawing'
              ? 'progress'
              : 'other',
        title: d.file_name,
        url: d.file_url,
        size: d.file_size,
        mime: d.mime_type,
        created_at: d.created_at,
      }))

      let countQuery = db.from('site_documents').select('*', { count: 'exact', head: true })
      if (siteId) countQuery = countQuery.eq('site_id', siteId)
      else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
        countQuery = countQuery.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') countQuery = countQuery.eq('document_type', 'blueprint')
      if (category === 'progress') countQuery = countQuery.eq('document_type', 'progress_drawing')
      if (category === 'other') countQuery = countQuery.eq('document_type', 'other')
      if (q) countQuery = countQuery.ilike('file_name', `%${q}%`)
      const { count } = await countQuery

      return mergeAndRespond(baseItems, count || 0)
    } catch (primaryErr: any) {
      // If site_documents is missing, fallback to legacy documents
      const code = primaryErr?.code || ''
      const msg: string = primaryErr?.message || ''
      const isMissingRelation =
        code === '42P01' || /relation .*site_documents.* does not exist/i.test(msg)
      if (!isMissingRelation) {
        // Non-schema errors → return empty set but 200 (preserve current behavior)
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }

      // Fallback: documents table
      let query = db
        .from('documents')
        .select('id, site_id, document_type, file_name, file_url, file_size, mime_type, created_at')
        .order('created_at', { ascending: false })
      if (siteId) query = query.eq('site_id', siteId)
      else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
        query = query.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') query = query.eq('document_type', 'blueprint')
      if (category === 'progress') query = query.eq('document_type', 'progress_drawing')
      if (category === 'other') query = query.eq('document_type', 'other')
      if (q) query = query.ilike('file_name', `%${q}%`)

      const { data, error } = await query.range(0, rangeEnd)
      if (error) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }

      const baseItems = (data || []).map((d: any) => ({
        id: d.id,
        site_id: d.site_id,
        category:
          d.document_type === 'blueprint'
            ? 'plan'
            : d.document_type === 'progress_drawing'
              ? 'progress'
              : 'other',
        title: d.file_name,
        url: d.file_url,
        size: d.file_size,
        mime: d.mime_type,
        created_at: d.created_at,
      }))

      let countQuery = db.from('documents').select('*', { count: 'exact', head: true })
      if (siteId) countQuery = countQuery.eq('site_id', siteId)
      else if (auth.role === 'customer_manager' && partnerAllowedSiteIds)
        countQuery = countQuery.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') countQuery = countQuery.eq('document_type', 'blueprint')
      if (category === 'progress') countQuery = countQuery.eq('document_type', 'progress_drawing')
      if (category === 'other') countQuery = countQuery.eq('document_type', 'other')
      if (q) countQuery = countQuery.ilike('file_name', `%${q}%`)
      const { count } = await countQuery

      return mergeAndRespond(baseItems, count || 0)
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
