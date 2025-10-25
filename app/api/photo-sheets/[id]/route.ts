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
    if (form.has('title')) patch.title = String(form.get('title') || '')
    if (form.has('orientation')) patch.orientation = String(form.get('orientation'))
    if (form.has('rows')) patch.rows = Number(form.get('rows'))
    if (form.has('cols')) patch.cols = Number(form.get('cols'))
    if (form.has('status')) patch.status = String(form.get('status'))
    if (form.has('site_id')) patch.site_id = String(form.get('site_id'))

    if (Object.keys(patch).length) {
      const db =
        auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase
      const { error: upErr } = await db.from('photo_sheets').update(patch).eq('id', id)
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
