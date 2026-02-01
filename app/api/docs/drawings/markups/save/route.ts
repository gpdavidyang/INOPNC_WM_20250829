import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  uploadDataUrlToDocumentsBucket,
  uploadBufferToDocumentsBucket,
} from '@/lib/storage/data-url'
import { createPdfFromImageDataUrl } from '@/lib/markups/pdf'
import { syncMarkupWorklogLinks } from '@/lib/documents/worklog-links'

export const dynamic = 'force-dynamic'

const isUuid = (value?: string | null) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const extractWorklogIds = (body: any): string[] => {
  const arrayKeyCandidates = ['worklogIds', 'worklog_ids', 'linked_worklog_ids', 'daily_report_ids']
  const singleKeyCandidates = ['linked_worklog_id', 'daily_report_id', 'worklogId', 'worklog_id']

  for (const key of arrayKeyCandidates) {
    const value = body?.[key]
    if (Array.isArray(value)) {
      return Array.from(
        new Set(
          value
            .filter((v: unknown): v is string => typeof v === 'string')
            .map(v => v.trim())
            .filter(v => isUuid(v))
        )
      )
    }
  }

  for (const key of singleKeyCandidates) {
    const value = body?.[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return isUuid(trimmed) ? [trimmed] : []
    }
  }

  return []
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const supabase = createClient()
    const serviceClient = createServiceRoleClient()

    const body = await request.json().catch(() => ({}))
    const drawingId = String(body?.drawingId || body?.drawing_id || '').trim()
    const siteIdFromBody = String(body?.siteId || body?.site_id || '').trim()
    const originalBlueprintUrlInput = String(
      body?.original_blueprint_url || body?.originalBlueprintUrl || ''
    ).trim()
    const originalBlueprintFilenameInput = String(
      body?.original_blueprint_filename || body?.originalBlueprintFilename || ''
    ).trim()
    const titleInput = (body?.title as string | undefined)?.trim()
    const description = (body?.description as string | undefined) || ''
    const markup_data = body?.markupData || body?.markup_data || []
    const preview_image_url =
      (body?.preview_image_url as string | undefined) ||
      (body?.previewImageUrl as string | undefined)
    const preview_image_data =
      (body?.preview_image_data as string | undefined) ||
      (body?.previewImageData as string | undefined)
    const published = Boolean(body?.published)

    const worklogIds = extractWorklogIds(body)
    const primaryWorklogId = worklogIds[0] ?? null

    // Fetch original drawing (UDS-first, fallback to legacy)
    let drawing: { id: string; site_id: string; file_name: string; file_url: string } | null = null
    let unifiedSourceId: string | null = null

    if (drawingId && isUuid(drawingId)) {
      const { data: udsDrawing } = await serviceClient
        .from('unified_document_system')
        .select('id, site_id, title, file_name, file_url, metadata')
        .eq('id', drawingId)
        .maybeSingle()

      if (udsDrawing) {
        drawing = {
          id: udsDrawing.id,
          site_id: udsDrawing.site_id,
          file_name: udsDrawing.file_name || udsDrawing.title || '도면',
          file_url: udsDrawing.file_url,
        }
        unifiedSourceId = udsDrawing.id
      } else {
        const { data: udsBySource } = await serviceClient
          .from('unified_document_system')
          .select('id, site_id, title, file_name, file_url')
          .eq('metadata->>source_site_document_id', drawingId)
          .maybeSingle()
        if (udsBySource) {
          drawing = {
            id: udsBySource.id,
            site_id: udsBySource.site_id,
            file_name: udsBySource.file_name || udsBySource.title || '도면',
            file_url: udsBySource.file_url,
          }
          unifiedSourceId = udsBySource.id
        }
      }
    }

    if (!drawing) {
      if (drawingId && isUuid(drawingId)) {
        const { data: legacyDrawing, error: drawErr } = await supabase
          .from('site_documents')
          .select('id, site_id, file_name, file_url')
          .eq('id', drawingId)
          .maybeSingle()
        if (!drawErr && legacyDrawing) {
          drawing = legacyDrawing as any
        }
      }
    }

    // Fallback: allow saving from a raw blueprint URL + siteId (e.g., when saving a new version from an existing markup)
    if (!drawing) {
      if (siteIdFromBody && originalBlueprintUrlInput) {
        drawing = {
          id: drawingId || 'manual',
          site_id: siteIdFromBody,
          file_name: originalBlueprintFilenameInput || titleInput || '도면',
          file_url: originalBlueprintUrlInput,
        }
      } else if (!drawingId) {
        return NextResponse.json(
          { success: false, error: 'drawingId or (siteId + original_blueprint_url) is required' },
          { status: 400 }
        )
      } else {
        return NextResponse.json({ success: false, error: 'Drawing not found' }, { status: 404 })
      }
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
    const original_blueprint_url = originalBlueprintUrlInput || drawing.file_url
    const original_blueprint_filename = originalBlueprintFilenameInput || drawing.file_name
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    let derivedPreviewUrl = preview_image_url
    let derivedPreviewPath: string | null = null
    let derivedPdfUrl: string | null = null
    let derivedPdfPath: string | null = null
    if (!derivedPreviewUrl && preview_image_data) {
      const uploaded = await uploadDataUrlToDocumentsBucket({
        dataUrl: preview_image_data,
        siteId: drawing.site_id,
        prefix: 'markup-previews',
        serviceClient,
      })
      if (uploaded) {
        derivedPreviewUrl = uploaded.url
        derivedPreviewPath = uploaded.path
      }
    }
    if (preview_image_data) {
      try {
        const pdfBuffer = await createPdfFromImageDataUrl(preview_image_data)
        if (pdfBuffer) {
          const uploadedPdf = await uploadBufferToDocumentsBucket({
            buffer: pdfBuffer,
            mimeType: 'application/pdf',
            siteId: drawing.site_id,
            prefix: 'markup-pdfs',
            serviceClient,
          })
          if (uploadedPdf) {
            derivedPdfUrl = uploadedPdf.url
            derivedPdfPath = uploadedPdf.path
          }
        }
      } catch (pdfError) {
        console.warn('[docs/drawings/markups/save] pdf snapshot skipped', pdfError)
      }
    }

    // Insert into markup_documents
    const { data: markupDoc, error: mdErr } = await supabase
      .from('markup_documents')
      .insert({
        title,
        description,
        original_blueprint_url,
        original_blueprint_filename,
        markup_data: markup_data || [],
        preview_image_url: derivedPreviewUrl,
        created_by: auth.userId,
        site_id: drawing.site_id,
        markup_count,
        file_size: 0,
        linked_worklog_id: primaryWorklogId,
      } as unknown)
      .select()
      .single()

    if (mdErr || !markupDoc) {
      console.error('[docs/drawings/markups/save] Failed to insert markup document:', mdErr)
      return NextResponse.json(
        { success: false, error: 'Failed to save markup document' },
        { status: 500 }
      )
    }

    try {
      if (worklogIds.length > 0) {
        await syncMarkupWorklogLinks(markupDoc.id, worklogIds)
      }
    } catch (linkError) {
      console.warn('[docs/drawings/markups/save] Failed to sync markup-worklog links', linkError)
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
          preview_image_url: derivedPreviewUrl,
          preview_storage_path: derivedPreviewPath,
          snapshot_pdf_url: derivedPdfUrl,
          snapshot_pdf_path: derivedPdfPath,
          linked_worklog_id: primaryWorklogId,
          linked_worklog_ids: worklogIds,
          daily_report_id: primaryWorklogId,
        },
      })
    } catch (_) {
      // ignore
    }

    // If published, create a progress drawing entry in site_documents using preview image
    let progressDocument: any = null
    if (published && derivedPreviewUrl) {
      const guessedExt = (() => {
        const m = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(derivedPreviewUrl || '')
        return m ? m[1].toLowerCase() : 'png'
      })()
      const mime =
        guessedExt === 'jpg' || guessedExt === 'jpeg'
          ? 'image/jpeg'
          : guessedExt === 'webp'
            ? 'image/webp'
            : 'image/png'
      const progressFileName = `${title}-progress.${guessedExt}`

      try {
        const { data: prog } = await supabase
          .from('site_documents')
          .insert({
            site_id: drawing.site_id,
            document_type: 'progress_drawing',
            file_name: progressFileName,
            file_url: derivedPreviewUrl,
            file_size: 0,
            mime_type: mime,
            uploaded_by: auth.userId,
            is_active: true,
            version: 1,
            notes: `Published from markup ${markupDoc.id}`,
          } as unknown)
          .select()
          .single()
        if (prog) progressDocument = prog
      } catch (legacyErr) {
        console.warn('[docs/drawings] progress legacy insert failed', legacyErr)
      }

      try {
        const { data: udsProgress } = await serviceClient
          .from('unified_document_system')
          .insert({
            title,
            description: '도면마킹에서 저장된 진행도면',
            file_name: progressFileName,
            file_url: derivedPreviewUrl,
            file_size: 0,
            mime_type: mime,
            category_type: 'shared',
            sub_category: 'progress_drawing',
            uploaded_by: auth.userId,
            site_id: drawing.site_id,
            status: 'active',
            is_archived: false,
            metadata: {
              source_table: 'markup_documents',
              source_id: markupDoc.id,
              markup_document_id: markupDoc.id,
              linked_site_document_id: progressDocument?.id ?? null,
              snapshot_pdf_url: derivedPdfUrl,
              preview_image_url: derivedPreviewUrl,
              original_blueprint_url,
              original_blueprint_filename,
              linked_worklog_id: primaryWorklogId,
              linked_worklog_ids: worklogIds,
              daily_report_id: primaryWorklogId,
              document_type: 'progress_drawing',
            },
          })
          .select()
          .single()
        if (udsProgress) {
          if (progressDocument) progressDocument.unified_document_id = udsProgress.id
          else progressDocument = udsProgress
        }
      } catch (udsErr) {
        console.warn('[docs/drawings] progress UDS insert failed', udsErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        markup: { ...markupDoc, preview_image_url: derivedPreviewUrl },
        progress: progressDocument,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
