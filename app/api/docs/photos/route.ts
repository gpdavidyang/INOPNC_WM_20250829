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
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId') || undefined
    const category =
      (searchParams.get('category') as 'before' | 'after' | 'other' | null) || undefined
    const limit = Math.min(120, Math.max(1, Number(searchParams.get('limit') || '60')))
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const q = (searchParams.get('q') || '').trim()

    // Customer-manager (partner alias) site access restriction
    if (auth.role === 'customer_manager') {
      if (!siteId) return NextResponse.json({ success: true, data: [] })
      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', auth.organizationId || '')
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

    let query = supabase
      .from('documents')
      .select('id, site_id, file_name, file_url, file_size, mime_type, folder_path, created_at')
      .or(IMAGE_OR)
      .order('created_at', { ascending: false })

    if (siteId) query = query.eq('site_id', siteId)
    if (category) query = query.ilike('folder_path', `%/${category}/%`)
    if (q) query = query.ilike('file_name', `%${q}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error } = await query
    if (error)
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })

    const items = (data || [])
      .filter((d: any) => {
        const mime = String(d?.mime_type || '')
        const name = String(d?.file_name || '')
        const looksImage =
          mime.toLowerCase().startsWith('image/') || /\.(png|jpe?g|webp|gif|heic)$/i.test(name)
        return looksImage && d?.file_url
      })
      .map((d: any) => ({
        id: d.id,
        site_id: d.site_id,
        title: d.file_name,
        url: d.file_url,
        size: d.file_size,
        mime: d.mime_type,
        created_at: d.created_at,
        category: (() => {
          const p = String(d.folder_path || '')
          if (p.includes('/before/')) return 'before'
          if (p.includes('/after/')) return 'after'
          return 'other'
        })(),
      }))

    let countQuery = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .or(IMAGE_OR)
    if (siteId) countQuery = countQuery.eq('site_id', siteId)
    if (category) countQuery = countQuery.ilike('folder_path', `%/${category}/%`)
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
    if (!file || !siteId)
      return NextResponse.json({ success: false, error: 'file, siteId required' }, { status: 400 })

    // Customer-manager (partner alias) access check
    if (auth.role === 'customer_manager') {
      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', auth.organizationId || '')
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
