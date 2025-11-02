import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, ctx: { params: { siteId: string } }) {
  const supabase = createClient()
  try {
    const { searchParams } = new URL(request.url)
    const siteId = ctx.params.siteId
    const docType = searchParams.get('doc_type') || undefined
    const includeHistory = searchParams.get('include_history') !== 'false'

    // 1) Resolve active document types (DB override -> fallback to defaults)
    let docTypes: Array<{
      code: string
      label: string
      required: { start: boolean; progress: boolean; completion: boolean }
      allowMultipleVersions: boolean
      sortOrder: number
      isActive: boolean
    }> = []
    try {
      const { data: typeRows } = await supabase
        .from('invoice_document_types')
        .select(
          'code, label, is_required_start, is_required_progress, is_required_completion, allow_multiple_versions, sort_order, is_active'
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (Array.isArray(typeRows) && typeRows.length > 0) {
        docTypes = typeRows.map(row => ({
          code: row.code,
          label: row.label,
          required: {
            start: !!row.is_required_start,
            progress: !!row.is_required_progress,
            completion: !!row.is_required_completion,
          },
          allowMultipleVersions: row.allow_multiple_versions !== false,
          sortOrder: Number(row.sort_order || 0),
          isActive: row.is_active !== false,
        }))
      }
    } catch {
      /* ignore DB lookup failure */
    }
    if (docTypes.length === 0) {
      docTypes = DEFAULT_INVOICE_DOC_TYPES
    }

    // 2) Pull documents for site
    const { data, error } = await supabase
      .from('unified_document_system')
      .select(
        `id, title, file_url, file_name, mime_type, uploaded_by, created_at, metadata, sub_category, tags,
         uploader:uploaded_by(full_name)`
      )
      .eq('category_type', 'invoice')
      .eq('site_id', siteId)
      .order('version', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    const documents = Array.isArray(data) ? data : []

    // 3) Group by document_type and compute latest/current
    const grouped: Record<string, any[]> = {}
    for (const r of documents) {
      const derivedDocType = r?.metadata?.doc_type || r?.sub_category || 'other'
      if (docType && derivedDocType !== docType) continue
      const t = derivedDocType
      if (!grouped[t]) grouped[t] = []
      grouped[t].push({
        id: r.id,
        title: r.title || r.file_name || '',
        file_url: r.file_url,
        file_name: r.file_name,
        mime_type: r.mime_type,
        uploaded_by: r.uploaded_by,
        uploader_name: r?.uploader?.full_name || null,
        created_at: r.created_at,
        stage: r?.metadata?.stage || r?.sub_category || null,
        metadata: r.metadata || null,
      })
    }

    // Keep only latest entry when include_history=false
    if (!includeHistory) {
      for (const key of Object.keys(grouped)) {
        grouped[key] = grouped[key].slice(0, 1)
      }
    }

    // 4) Calculate progress per stage
    const stageProgress: Record<
      'start' | 'progress' | 'completion',
      { required: number; fulfilled: number }
    > = {
      start: { required: 0, fulfilled: 0 },
      progress: { required: 0, fulfilled: 0 },
      completion: { required: 0, fulfilled: 0 },
    }

    const activeTypes = docTypes
      .filter(t => t.isActive !== false)
      .sort((a, b) => {
        const ao = Number(a.sortOrder || 0)
        const bo = Number(b.sortOrder || 0)
        return ao - bo
      })
    for (const type of activeTypes) {
      if (type.required.start) {
        stageProgress.start.required += 1
        if (grouped[type.code]?.length) stageProgress.start.fulfilled += 1
      }
      if (type.required.progress) {
        stageProgress.progress.required += 1
        if (grouped[type.code]?.length) stageProgress.progress.fulfilled += 1
      }
      if (type.required.completion) {
        stageProgress.completion.required += 1
        if (grouped[type.code]?.length) stageProgress.completion.fulfilled += 1
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        siteId,
        docTypes: activeTypes,
        documents: grouped,
        progress: stageProgress,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, data: { documents: {}, docTypes: [] } })
  }
}
