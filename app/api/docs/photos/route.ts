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
    let svc: ReturnType<typeof createServiceClient> | ReturnType<typeof createClient> = supabase
    try {
      svc = createServiceClient()
    } catch {
      svc = supabase
    }
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId') || undefined
    const category =
      (searchParams.get('category') as 'before' | 'after' | 'other' | null) || undefined
    const limit = Math.min(120, Math.max(1, Number(searchParams.get('limit') || '60')))
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const q = (searchParams.get('q') || '').trim()
    const partnerCompanyId = (auth as any).organizationId || auth.restrictedOrgId || null

    // Customer-manager (partner alias) site access restriction
    if (auth.role === 'customer_manager') {
      if (!siteId) return NextResponse.json({ success: true, data: [] })
      const { data: mapping } = await (svc as any)
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', partnerCompanyId || '')
        .eq('is_active', true)
        .maybeSingle()
      if (!mapping)
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const IMAGE_OR = [
      'mime_type.ilike.image/%',
      'file_name.ilike.%.png',
      'file_name.ilike.%.jpg',
      'file_name.ilike.%.jpeg',
      'file_name.ilike.%.webp',
      'file_name.ilike.%.gif',
      'file_name.ilike.%.heic',
    ].join(',')

    let query = (svc as any)
      .from('documents')
      .select(
        'id, site_id, file_name, file_url, file_size, mime_type, folder_path, created_at, sites (name)'
      )
      .or(IMAGE_OR)
      .order('created_at', { ascending: false })

    if (siteId) query = query.eq('site_id', siteId)
    if (category) query = query.ilike('folder_path', `%/${category}/%`)
    if (q) query = query.ilike('file_name', `%${q}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const [docRes] = await Promise.all([query])

    const { data, error } = docRes
    if (error) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const docs = (data || []).filter((d: any) => {
      const mime = String(d?.mime_type || '')
      const name = String(d?.file_name || '')
      const looksImage =
        mime.toLowerCase().startsWith('image/') || /\.(png|jpe?g|webp|gif|heic)$/i.test(name)
      return looksImage
    })

    const derivePath = (row: any) => {
      const folder = String(row.folder_path || '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
      const file = String(row.file_name || '')
      if (folder || file) {
        return folder ? `${folder}/${file}` : file || null
      }
      const url = String(row.file_url || '')
      if (!url) return null
      // Match /object/(public|sign)/documents/<path>
      const match = url.match(/\/object\/[^/]+\/documents\/(.+)$/)
      if (match && match[1]) return `documents/${match[1]}`
      return null
    }

    const docPaths = docs.map((d: any) => derivePath(d)).filter((p): p is string => !!p)

    const signedDocMap = new Map<string, string>()
    if (docPaths.length) {
      try {
        const svc = createServiceClient()
        const { data: signed } = await (svc as any).storage
          .from('documents')
          .createSignedUrls(docPaths, 60 * 60)
        if (Array.isArray(signed)) {
          signed.forEach((s: any) => {
            if (s?.path && s?.signedUrl) signedDocMap.set(s.path, s.signedUrl)
          })
        }
      } catch (e) {
        console.warn('[docs/photos] doc signed url skipped', e)
      }
    }

    const docItems = docs.map((d: any) => {
      const path = derivePath(d)
      const url = path ? signedDocMap.get(path) || d.file_url || '' : d.file_url || ''
      const category = (() => {
        const p = String(d.folder_path || '')
        if (p.includes('/before/')) return 'before'
        if (p.includes('/after/')) return 'after'
        return 'other'
      })()
      return {
        id: d.id,
        site_id: d.site_id,
        site_name: d?.sites?.name || null,
        title: d.file_name,
        url,
        size: d.file_size,
        mime: d.mime_type,
        created_at: d.created_at,
        category,
        source: 'documents',
      }
    })

    // Additional photos from daily reports
    let addlItems: any[] = []
    try {
      const { data: addlData, error: addlError } = await (svc as any)
        .from('daily_report_additional_photos')
        .select(
          `
          id,
          photo_type,
          file_url,
          file_path,
          file_name,
          file_size,
          created_at,
          daily_reports (
            site_id,
            work_date,
            work_description,
            sites (
              name
            )
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit * 3) // buffer before pagination merge
        .ilike('file_name', q ? `%${q}%` : '%')

      let filtered = addlData || []
      if (siteId)
        filtered = filtered.filter((row: any) => String(row?.daily_reports?.site_id) === siteId)
      if (category)
        filtered = filtered.filter((row: any) => (row?.photo_type || 'other') === category)

      const paths = filtered.map((r: any) => r.file_path).filter(Boolean)
      const signedMap = new Map<string, string>()
      if (paths.length) {
        try {
          const svc = createServiceClient()
          const { data: signedList } = await (svc as any).storage
            .from('daily-reports')
            .createSignedUrls(paths, 60 * 60)
          if (Array.isArray(signedList)) {
            signedList.forEach((s: any) => {
              if (s?.path && s?.signedUrl) signedMap.set(s.path, s.signedUrl)
            })
          }
        } catch (e) {
          console.warn('[docs/photos] additional photo signed url skipped', e)
        }
      }

      addlItems = filtered.map((row: any) => {
        const signed = row.file_path ? signedMap.get(row.file_path) : null
        return {
          id: row.id,
          site_id: row?.daily_reports?.site_id || null,
          site_name: row?.daily_reports?.sites?.name || null,
          work_description: row?.daily_reports?.work_description || null,
          work_date: row?.daily_reports?.work_date || null,
          title: row.file_name,
          url: signed || row.file_url,
          size: row.file_size,
          mime: 'image/jpeg',
          created_at: row.created_at,
          category: row.photo_type || 'other',
          source: 'additional',
        }
      })

      if (addlError) {
        console.warn('[docs/photos] additional photo query error', addlError)
      }
    } catch (e) {
      console.warn('[docs/photos] additional photo fetch failed', e)
    }

    const combined = [...docItems, ...addlItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const total = combined.length
    const start = (page - 1) * limit
    const end = start + limit
    const pageItems = combined.slice(start, end)

    return NextResponse.json({
      success: true,
      data: pageItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    let supabase
    let usingServiceKey = false
    try {
      supabase = createServiceClient()
      usingServiceKey = true
    } catch (error) {
      console.warn('[docs/photos] Service key missing, falling back to user session client')
      supabase = createClient()
    }

    const form = await request.formData()
    const file = form.get('file') as File
    const siteId = String(form.get('siteId') || '')
    const category = String(form.get('category') || 'other') as 'before' | 'after' | 'other'
    const partnerCompanyId = (auth as any).organizationId || auth.restrictedOrgId || null
    if (!file || !siteId)
      return NextResponse.json({ success: false, error: 'file, siteId required' }, { status: 400 })

    // Customer-manager (partner alias) access check
    if (auth.role === 'customer_manager') {
      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', partnerCompanyId || '')
        .eq('is_active', true)
        .maybeSingle()
      if (!mapping)
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    if (file.size > 20 * 1024 * 1024)
      return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 })
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type))
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `photos/${siteId}/${category}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const bucket = 'documents'
    const { data: up, error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, duplex: 'half' })
    if (upErr) {
      console.error('[docs/photos] storage upload failed', {
        error: upErr,
        usingServiceKey,
        bucket,
        path,
      })
      return NextResponse.json(
        { success: false, error: upErr.message || 'Upload failed' },
        { status: 500 }
      )
    }
    const storagePath = up.path
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath)

    const { data: row, error: dbErr } = await supabase
      .from('documents')
      .insert({
        title: file.name,
        file_name: file.name,
        file_url: pub.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        document_type: 'other',
        folder_path: storagePath,
        // storage_bucket / storage_path columns are not present in the current schema; keep only folder_path
        owner_id: auth.userId,
        site_id: siteId,
        is_public: false,
      })
      .select()
      .single()
    if (dbErr) {
      console.error('[docs/photos] database insert failed', {
        error: dbErr,
        usingServiceKey,
        bucket,
        storagePath,
      })
      return NextResponse.json(
        { success: false, error: dbErr.message || 'DB error' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        url: pub.publicUrl,
        site_id: row.site_id,
        folder_path: row.folder_path,
        document_type: row.document_type,
      },
    })
  } catch (e: any) {
    console.error('[docs/photos] unexpected error', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    let supabase
    try {
      supabase = createServiceClient()
    } catch {
      supabase = createClient()
    }

    const payload = await request.json().catch(() => ({}))
    const id = String(payload?.id || '')
    const title = (payload?.title || '').toString().trim()

    if (!id || !title) {
      return NextResponse.json(
        { success: false, error: 'id and title are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('documents')
      .update({ title, file_name: title })
      .eq('id', id)
      .eq('document_type', 'other')

    if (error) {
      console.error('[docs/photos] update failed', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Update failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[docs/photos] PATCH error', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    let supabase
    try {
      supabase = createServiceClient()
    } catch {
      supabase = createClient()
    }

    const payload = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(payload?.ids)
      ? payload.ids.map((id: any) => String(id)).filter(Boolean)
      : []

    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'ids required' }, { status: 400 })
    }

    const { data, error: fetchErr } = await supabase
      .from('documents')
      .select('id, folder_path')
      .in('id', ids)
      .eq('document_type', 'other')

    if (fetchErr) {
      console.error('[docs/photos] delete fetch failed', fetchErr)
      return NextResponse.json(
        { success: false, error: fetchErr.message || 'Delete failed' },
        { status: 500 }
      )
    }

    const pathsToRemove = (data || [])
      .map((row: any) => String(row?.folder_path || '').trim())
      .filter(p => p.length > 0)

    if (pathsToRemove.length > 0) {
      const { error: rmErr } = await supabase.storage.from('documents').remove(pathsToRemove)
      if (rmErr) {
        console.error('[docs/photos] storage delete failed', rmErr)
        return NextResponse.json(
          { success: false, error: rmErr.message || 'Storage delete failed' },
          { status: 500 }
        )
      }
    }

    const { error: delErr } = await supabase.from('documents').delete().in('id', ids)
    if (delErr) {
      console.error('[docs/photos] db delete failed', delErr)
      return NextResponse.json(
        { success: false, error: delErr.message || 'Delete failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (e: any) {
    console.error('[docs/photos] DELETE error', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
