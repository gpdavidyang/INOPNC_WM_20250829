import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const supabase = createClient()

    const body = await request.json().catch(() => ({}))
    const drawingId = String(body?.drawingId || body?.drawing_id || '')
    const titleInput = (body?.title as string | undefined)?.trim()
    const description = (body?.description as string | undefined) || ''
    const markup_data = body?.markupData || body?.markup_data || []
    const preview_image_url =
      (body?.preview_image_url as string | undefined) ||
      (body?.previewImageUrl as string | undefined)
    const published = Boolean(body?.published)

    if (!drawingId) {
      return NextResponse.json({ success: false, error: 'drawingId is required' }, { status: 400 })
    }

    // Fetch original drawing(site_documents)
    const { data: drawing, error: drawErr } = await supabase
      .from('site_documents')
      .select('id, site_id, file_name, file_url')
      .eq('id', drawingId)
      .maybeSingle()

    if (drawErr || !drawing) {
      return NextResponse.json({ success: false, error: 'Drawing not found' }, { status: 404 })
    }

    // Customer-manager (partner alias) access check
    if (auth.role === 'customer_manager') {
      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', drawing.site_id)
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

    const title = titleInput || `${drawing.file_name || '도면'} 마킹`
    const original_blueprint_url = drawing.file_url
    const original_blueprint_filename = drawing.file_name
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    // Insert into markup_documents
    const { data: markupDoc, error: mdErr } = await supabase
      .from('markup_documents')
      .insert({
        title,
        description,
        original_blueprint_url,
        original_blueprint_filename,
        markup_data: markup_data || [],
        preview_image_url,
        created_by: auth.userId,
        site_id: drawing.site_id,
        markup_count,
        file_size: 0,
        status: published ? 'approved' : 'pending',
      } as unknown)
      .select()
      .single()

    if (mdErr || !markupDoc) {
      return NextResponse.json(
        { success: false, error: 'Failed to save markup document' },
        { status: 500 }
      )
    }

    // Try to sync into unified_document_system (best-effort)
    try {
      await supabase.from('unified_document_system').insert({
        title,
        description,
        file_name: `${title}.markup`,
        file_url: `/api/markup-documents/${markupDoc.id}/file`,
        file_size: 0,
        mime_type: 'application/markup-document',
        category_type: 'markup',
        uploaded_by: auth.userId,
        site_id: drawing.site_id,
        status: 'uploaded',
        is_public: false,
        metadata: {
          source_table: 'markup_documents',
          source_id: markupDoc.id,
          markup_count,
          original_blueprint_url,
          original_blueprint_filename,
        },
      })
    } catch (_) {
      // ignore
    }

    // If published, create a progress drawing entry in site_documents using preview image
    let progressDocument: any = null
    if (published && preview_image_url) {
      const guessedExt = (() => {
        const m = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(preview_image_url)
        return m ? m[1].toLowerCase() : 'png'
      })()
      const mime =
        guessedExt === 'jpg' || guessedExt === 'jpeg'
          ? 'image/jpeg'
          : guessedExt === 'webp'
            ? 'image/webp'
            : 'image/png'
      const { data: prog, error: progErr } = await supabase
        .from('site_documents')
        .insert({
          site_id: drawing.site_id,
          document_type: 'progress_drawing',
          file_name: `${title}-progress.${guessedExt}`,
          file_url: preview_image_url,
          file_size: 0,
          mime_type: mime,
          uploaded_by: auth.userId,
          is_active: true,
          version: 1,
          notes: `Published from markup ${markupDoc.id}`,
        } as unknown)
        .select()
        .single()
      if (!progErr) progressDocument = prog
    }

    return NextResponse.json({
      success: true,
      data: { markup: markupDoc, progress: progressDocument },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
