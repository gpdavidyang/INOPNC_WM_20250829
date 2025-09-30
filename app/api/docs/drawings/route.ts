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

    // Partner: if siteId provided, verify mapping; if not, return empty
    if (auth.role === 'partner') {
      if (!siteId) {
        return NextResponse.json({ success: true, data: [] })
      }
      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', auth.organizationId || '')
        .eq('is_active', true)
        .maybeSingle()
      if (!mapping) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this site' },
          { status: 403 }
        )
      }
    }

    let query = db
      .from('site_documents')
      .select('id, site_id, document_type, file_name, file_url, file_size, mime_type, created_at')
      .order('created_at', { ascending: false })

    if (siteId) query = query.eq('site_id', siteId)
    // Map UI category to document_type
    // - plan      -> blueprint
    // - progress  -> progress_drawing
    // - other     -> other
    if (category === 'plan') query = query.eq('document_type', 'blueprint')
    if (category === 'progress') query = query.eq('document_type', 'progress_drawing')
    if (category === 'other') query = query.eq('document_type', 'other')
    if (q) query = query.ilike('file_name', `%${q}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error } = await query
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

    // Count for pagination
    let countQuery = db.from('site_documents').select('*', { count: 'exact', head: true })
    if (siteId) countQuery = countQuery.eq('site_id', siteId)
    if (category === 'plan') countQuery = countQuery.eq('document_type', 'blueprint')
    if (category === 'progress') countQuery = countQuery.eq('document_type', 'progress_drawing')
    if (category === 'other') countQuery = countQuery.eq('document_type', 'other')
    if (q) countQuery = countQuery.ilike('file_name', `%${q}%`)
    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
