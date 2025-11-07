import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    const siteId = request.nextUrl.searchParams.get('site_id')

    // Use proper PostgREST embed syntax via the FK column name
    let query = supabase
      .from('photo_sheets')
      .select('*, site:sites!photo_sheets_site_id_fkey (id, name, organization_id)')
      .order('created_at', { ascending: false })

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // Note: Avoid filtering on nested relation keys here; some PostgREST versions
    // do not support it reliably and may cause 500s. RLS should trim rows server-side,
    // and we also post-filter below for additional safety.

    let rows: any[] | null = null
    let error: any = null
    try {
      const res = await query
      rows = res.data as any[] | null
      error = res.error
    } catch (e) {
      error = e
    }

    // Fallback: if relation embed fails, retry minimal select and enrich manually
    if (error) {
      console.warn(
        'GET /api/photo-sheets relation select failed, falling back:',
        error?.message || error
      )
      let fallbackRows: any[] = []
      const baseSel = supabase
        .from('photo_sheets')
        .select('*')
        .order('created_at', { ascending: false })
      const baseQuery = siteId ? baseSel.eq('site_id', siteId) : baseSel
      const { data: simpleRows, error: simpleErr } = await baseQuery
      if (simpleErr) {
        const msg = simpleErr.message || String(simpleErr)
        console.error('GET /api/photo-sheets fallback select error:', msg)
        // If table doesn't exist yet, return a 200 with a helpful code so UI can guide admin
        if (/does not exist/i.test(msg) && /photo_sheets/i.test(msg)) {
          return NextResponse.json({
            success: false,
            code: 'MISSING_TABLES',
            error:
              'photo_sheets (and items) tables not found. Apply migration migrations/2025-10-25_create_photo_sheets.sql.',
          })
        }
        return NextResponse.json({ error: msg || 'Failed to fetch' }, { status: 500 })
      }
      fallbackRows = simpleRows || []

      // If restricted, fetch sites to enforce org boundary and enrich site info
      let enriched: any[] = fallbackRows
      if (auth.isRestricted) {
        const siteIds = Array.from(new Set(fallbackRows.map((r: any) => r.site_id).filter(Boolean)))
        if (siteIds.length > 0) {
          const { data: siteRows } = await supabase
            .from('sites')
            .select('id, name, organization_id')
            .in('id', siteIds)
          const siteMap = new Map((siteRows || []).map((s: any) => [s.id, s]))
          enriched = fallbackRows
            .map((r: any) => ({ ...r, site: siteMap.get(r.site_id) || null }))
            .filter((r: any) => (r.site?.organization_id || null) === auth.restrictedOrgId)
        }
      } else {
        // For admins/managers, enrich names for consistency
        const siteIds = Array.from(new Set(fallbackRows.map((r: any) => r.site_id).filter(Boolean)))
        if (siteIds.length > 0) {
          const { data: siteRows } = await supabase
            .from('sites')
            .select('id, name, organization_id')
            .in('id', siteIds)
          const siteMap = new Map((siteRows || []).map((s: any) => [s.id, s]))
          enriched = fallbackRows.map((r: any) => ({ ...r, site: siteMap.get(r.site_id) || null }))
        }
      }

      return NextResponse.json({ success: true, data: enriched })
    }

    const scoped = auth.isRestricted
      ? (rows || []).filter(r => (r as any).site?.organization_id === auth.restrictedOrgId)
      : rows || []

    return NextResponse.json({ success: true, data: scoped })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/photo-sheets exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    const form = await request.formData()
    const supabase = await createClient()

    // Check site access for restricted users
    const site_id = String(form.get('site_id') || '')
    if (!site_id) return NextResponse.json({ error: 'site_id is required' }, { status: 400 })

    const { data: site, error: siteErr } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', site_id)
      .single()

    if (siteErr || !site) return NextResponse.json({ error: 'Invalid site' }, { status: 400 })
    if (!(await canAccessData(auth, (site as any).organization_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Core fields
    const title = String(form.get('title') || '')
    const orientation = String(form.get('orientation') || 'portrait') as 'portrait' | 'landscape'
    const rows = Number(form.get('rows') || 1)
    const cols = Number(form.get('cols') || 1)
    const status = String(form.get('status') || 'draft') as 'draft' | 'final'

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
    if (!['portrait', 'landscape'].includes(orientation))
      return NextResponse.json({ error: 'invalid orientation' }, { status: 400 })
    if (rows <= 0 || cols <= 0)
      return NextResponse.json({ error: 'invalid rows/cols' }, { status: 400 })

    let sourceDailyReportId = String(form.get('source_daily_report_id') || '').trim()
    if (!sourceDailyReportId) sourceDailyReportId = ''
    let sourceDailyReportSummary = String(form.get('source_daily_report_summary') || '').trim()

    if (sourceDailyReportId) {
      const { data: linkedReport, error: linkedErr } = await supabase
        .from('daily_reports')
        .select('id, site_id, work_date, component_name, process_type')
        .eq('id', sourceDailyReportId)
        .maybeSingle()

      if (linkedErr || !linkedReport) {
        return NextResponse.json({ error: '존재하지 않는 작업일지입니다.' }, { status: 400 })
      }
      if (linkedReport.site_id !== site_id) {
        return NextResponse.json(
          { error: '선택한 작업일지가 해당 현장과 일치하지 않습니다.' },
          { status: 400 }
        )
      }
      if (!sourceDailyReportSummary) {
        const parts: string[] = []
        if (linkedReport.work_date) {
          try {
            parts.push(
              new Date(linkedReport.work_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            )
          } catch {
            parts.push(linkedReport.work_date)
          }
        }
        if (linkedReport.component_name) parts.push(linkedReport.component_name)
        if (linkedReport.process_type) parts.push(linkedReport.process_type)
        sourceDailyReportSummary = parts.join(' / ')
      }
    }

    // Insert sheet (use service client for admins to avoid RLS interference)
    const db =
      auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase

    const attemptInsert = async (payload: Record<string, any>) =>
      db.from('photo_sheets').insert(payload).select().single()

    const insertPayload = {
      title,
      orientation,
      rows,
      cols,
      site_id,
      status,
      created_by: auth.userId,
      source_daily_report_id: sourceDailyReportId || null,
      source_daily_report_summary: sourceDailyReportSummary || null,
    }

    let { data: sheet, error: insErr } = await attemptInsert(insertPayload)
    const isMissingSourceColumns = (message?: string) =>
      !!message && /source_daily_report/i.test(message)

    if (insErr && isMissingSourceColumns(insErr.message || '')) {
      const fallbackPayload = { ...insertPayload }
      delete fallbackPayload.source_daily_report_id
      delete fallbackPayload.source_daily_report_summary
      const fallback = await attemptInsert(fallbackPayload)
      sheet = fallback.data
      insErr = fallback.error
    }

    if (insErr || !sheet) {
      console.error('Insert photo_sheets error:', insErr)
      return NextResponse.json(
        { error: insErr?.message || 'Failed to create sheet' },
        { status: 500 }
      )
    }

    // Parse items JSON
    const itemsRaw = form.get('items') as string | null
    let items: any[] = []
    if (itemsRaw) {
      try {
        items = JSON.parse(itemsRaw)
      } catch {
        items = []
      }
    }

    // Upload files and insert items
    const service = createServiceClient()
    const itemRows: any[] = []
    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {}
      const index = Number(it.index ?? i)
      const file = form.get(`file_${index}`) as File | null
      let image_url: string | null = null
      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const ext = (file.type?.split('/')?.[1] || 'jpg').toLowerCase()
        const path = `photosheets/${sheet.id}/${index}.${ext}`
        const { error: upErr } = await service.storage
          .from('documents')
          .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: true })
        if (upErr) throw new Error(`upload failed: ${upErr.message}`)
        const { data: pub } = service.storage.from('documents').getPublicUrl(path)
        image_url = pub.publicUrl
      } else if (it.image_url) {
        image_url = String(it.image_url)
      }

      itemRows.push({
        photosheet_id: sheet.id,
        item_index: index,
        member_name: it.member ?? null,
        process_name: it.process ?? null,
        content: it.content ?? null,
        stage: it.stage ?? null,
        image_url,
        width: it.width ?? null,
        height: it.height ?? null,
        mime: file?.type || it.mime || null,
      })
    }

    if (itemRows.length) {
      const { error: itemErr } = await supabase.from('photo_sheet_items').insert(itemRows)
      if (itemErr) {
        console.error('Insert photo_sheet_items error:', itemErr)
      }
    }

    return NextResponse.json({ success: true, data: sheet })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('POST /api/photo-sheets exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true })
}
