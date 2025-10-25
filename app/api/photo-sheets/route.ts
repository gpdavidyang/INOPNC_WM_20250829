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

    let query = supabase
      .from('photo_sheets')
      .select('*, site:sites(id, name, organization_id)')
      .order('created_at', { ascending: false })

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // Note: Avoid filtering on nested relation keys here; some PostgREST versions
    // do not support it reliably and may cause 500s. RLS should trim rows server-side,
    // and we also post-filter below for additional safety.

    const { data: rows, error } = await query

    if (error) {
      console.error('GET /api/photo-sheets error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 })
    }

    const scoped = auth.isRestricted
      ? (rows || []).filter(r => (r as any).site?.organization_id === auth.restrictedOrgId)
      : rows || []

    return NextResponse.json({ success: true, data: scoped })
  } catch (e) {
    console.error('GET /api/photo-sheets exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Insert sheet (use service client for admins to avoid RLS interference)
    const db =
      auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase
    const { data: sheet, error: insErr } = await db
      .from('photo_sheets')
      .insert({ title, orientation, rows, cols, site_id, status, created_by: auth.userId })
      .select()
      .single()

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
    console.error('POST /api/photo-sheets exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true })
}
