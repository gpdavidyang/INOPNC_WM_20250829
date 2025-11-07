import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(_request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    const id = ctx.params.id
    const { data: sheet, error } = await supabase
      .from('photo_sheets')
      .select('*, site:sites!photo_sheets_site_id_fkey (id, name, organization_id)')
      .eq('id', id)
      .single()

    if (error || !sheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (auth.isRestricted) {
      const org = (sheet as any).site?.organization_id
      if (!(await canAccessData(auth, org)))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: items } = await supabase
      .from('photo_sheet_items')
      .select('*')
      .eq('photosheet_id', id)
      .order('item_index', { ascending: true })

    return NextResponse.json({ success: true, data: { ...sheet, items: items || [] } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/photo-sheets/[id] exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    const id = ctx.params.id
    const supabase = await createClient()

    // Load sheet to check access/site
    const { data: sheet, error: loadErr } = await supabase
      .from('photo_sheets')
      .select('*, site:sites!photo_sheets_site_id_fkey (id, organization_id)')
      .eq('id', id)
      .single()
    if (loadErr || !sheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const orgId = (sheet as any).site?.organization_id
    if (!(await canAccessData(auth, orgId)))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const form = await request.formData()
    const patch: Record<string, any> = {}
    const isMissingSourceColumns = (message?: string) =>
      !!message && /source_daily_report/i.test(message)

    if (form.has('title')) patch.title = String(form.get('title') || '')
    if (form.has('orientation')) patch.orientation = String(form.get('orientation'))
    if (form.has('rows')) patch.rows = Number(form.get('rows'))
    if (form.has('cols')) patch.cols = Number(form.get('cols'))
    if (form.has('status')) patch.status = String(form.get('status'))
    if (form.has('site_id')) patch.site_id = String(form.get('site_id'))

    let newSourceReportId: string | null | undefined = undefined
    if (form.has('source_daily_report_id')) {
      const raw = String(form.get('source_daily_report_id') || '').trim()
      newSourceReportId = raw || null
    }
    let newSourceSummary: string | null | undefined = undefined
    if (form.has('source_daily_report_summary')) {
      const raw = String(form.get('source_daily_report_summary') || '').trim()
      newSourceSummary = raw || null
    }

    if (newSourceReportId !== undefined) {
      if (newSourceReportId) {
        const { data: linkedReport, error: linkedErr } = await supabase
          .from('daily_reports')
          .select('id, site_id, work_date, component_name, process_type')
          .eq('id', newSourceReportId)
          .maybeSingle()
        if (linkedErr || !linkedReport) {
          return NextResponse.json({ error: '존재하지 않는 작업일지입니다.' }, { status: 400 })
        }
        if (patch.site_id && patch.site_id !== linkedReport.site_id) {
          return NextResponse.json(
            { error: '선택한 작업일지가 변경된 현장과 일치하지 않습니다.' },
            { status: 400 }
          )
        }
        if (!patch.site_id && linkedReport.site_id !== (sheet as any).site?.id) {
          return NextResponse.json(
            { error: '선택한 작업일지가 해당 현장과 일치하지 않습니다.' },
            { status: 400 }
          )
        }
        patch.source_daily_report_id = newSourceReportId
        if (!newSourceSummary) {
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
          patch.source_daily_report_summary = parts.join(' / ')
        }
      } else {
        patch.source_daily_report_id = null
        if (newSourceSummary !== undefined) {
          patch.source_daily_report_summary = newSourceSummary
        }
      }
    }

    if (newSourceReportId === undefined && newSourceSummary !== undefined) {
      patch.source_daily_report_summary = newSourceSummary
    }

    if (Object.keys(patch).length) {
      const db =
        auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase
      const attemptUpdate = async (payload: Record<string, any>) =>
        db.from('photo_sheets').update(payload).eq('id', id)
      let { error: upErr } = await attemptUpdate(patch)
      if (upErr && isMissingSourceColumns(upErr.message)) {
        const fallbackPatch = { ...patch }
        delete fallbackPatch.source_daily_report_id
        delete fallbackPatch.source_daily_report_summary
        const fallback = await attemptUpdate(fallbackPatch)
        upErr = fallback.error
      }
      if (upErr) {
        console.error('Update sheet error:', upErr)
        return NextResponse.json(
          { error: upErr.message || 'Failed to update sheet' },
          { status: 500 }
        )
      }
    }

    // Items handling
    const itemsRaw = form.get('items') as string | null
    let items: any[] = []
    if (itemsRaw) {
      try {
        items = JSON.parse(itemsRaw)
      } catch {
        items = []
      }
    }

    const service = createServiceClient()
    if (items.length) {
      // Replace strategy: delete existing, insert new snapshot
      const { error: delErr } = await supabase
        .from('photo_sheet_items')
        .delete()
        .eq('photosheet_id', id)
      if (delErr) console.warn('Delete existing items failed (continuing):', delErr)

      const rows: any[] = []
      for (let i = 0; i < items.length; i++) {
        const it = items[i] || {}
        const index = Number(it.index ?? i)
        const file = form.get(`file_${index}`) as File | null
        let image_url: string | null = null
        if (file) {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const ext = (file.type?.split('/')?.[1] || 'jpg').toLowerCase()
          const path = `photosheets/${id}/${index}.${ext}`
          const { error: upErr } = await service.storage
            .from('documents')
            .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: true })
          if (upErr) throw new Error(`upload failed: ${upErr.message}`)
          const { data: pub } = service.storage.from('documents').getPublicUrl(path)
          image_url = pub.publicUrl
        } else if (it.image_url) {
          image_url = String(it.image_url)
        }
        rows.push({
          photosheet_id: id,
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

      if (rows.length) {
        const { error: insErr } = await supabase.from('photo_sheet_items').insert(rows)
        if (insErr) console.error('Insert new items error:', insErr)
      }
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('PUT /api/photo-sheets/[id] exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult
    const id = ctx.params.id
    const supabase = await createClient()

    const { data: sheet, error: loadErr } = await supabase
      .from('photo_sheets')
      .select('*, site:sites(id, organization_id)')
      .eq('id', id)
      .single()
    if (loadErr || !sheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const orgId = (sheet as any).site?.organization_id
    if (!(await canAccessData(auth, orgId)))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db =
      auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase
    const { error: delErr } = await db.from('photo_sheets').delete().eq('id', id)
    if (delErr) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('DELETE /api/photo-sheets/[id] exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}
