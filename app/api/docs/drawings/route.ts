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

    // Partner: build allowed site list; if siteId provided but not allowed -> 403
    // If no siteId, aggregate across allowed sites
    let partnerAllowedSiteIds: string[] | null = null
    if (auth.role === 'partner') {
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

    // Primary: site_documents
    try {
      let query = db
        .from('site_documents')
        .select('id, site_id, document_type, file_name, file_url, file_size, mime_type, created_at')
        .order('created_at', { ascending: false })

      if (siteId) query = query.eq('site_id', siteId)
      else if (auth.role === 'partner' && partnerAllowedSiteIds)
        query = query.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') query = query.eq('document_type', 'blueprint')
      if (category === 'progress') query = query.eq('document_type', 'progress_drawing')
      if (category === 'other') query = query.eq('document_type', 'other')
      if (q) query = query.ilike('file_name', `%${q}%`)

      const { data, error } = await query.range(from, to)
      if (error) throw error

      const items = (data || []).map((d: any) => ({
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
      else if (auth.role === 'partner' && partnerAllowedSiteIds)
        countQuery = countQuery.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') countQuery = countQuery.eq('document_type', 'blueprint')
      if (category === 'progress') countQuery = countQuery.eq('document_type', 'progress_drawing')
      if (category === 'other') countQuery = countQuery.eq('document_type', 'other')
      if (q) countQuery = countQuery.ilike('file_name', `%${q}%`)
      const { count } = await countQuery

      return NextResponse.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
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
      else if (auth.role === 'partner' && partnerAllowedSiteIds)
        query = query.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') query = query.eq('document_type', 'blueprint')
      if (category === 'progress') query = query.eq('document_type', 'progress_drawing')
      if (category === 'other') query = query.eq('document_type', 'other')
      if (q) query = query.ilike('file_name', `%${q}%`)

      const { data, error } = await query.range(from, to)
      if (error) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }

      const items = (data || []).map((d: any) => ({
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
      else if (auth.role === 'partner' && partnerAllowedSiteIds)
        countQuery = countQuery.in('site_id', partnerAllowedSiteIds)
      if (category === 'plan') countQuery = countQuery.eq('document_type', 'blueprint')
      if (category === 'progress') countQuery = countQuery.eq('document_type', 'progress_drawing')
      if (category === 'other') countQuery = countQuery.eq('document_type', 'other')
      if (q) countQuery = countQuery.ilike('file_name', `%${q}%`)
      const { count } = await countQuery

      return NextResponse.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
