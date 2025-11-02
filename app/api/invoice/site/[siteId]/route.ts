import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, ctx: { params: { siteId: string } }) {
  const supabase = createServiceRoleClient()
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

    // 2) Pull documents for site (unified_document_system authoritative)
    const { data, error } = await supabase
      .from('unified_document_system')
      .select(
        'id, title, file_url, file_name, mime_type, uploaded_by, created_at, metadata, sub_category, category_type, site_id, status, uploader:uploaded_by(full_name)'
      )
      .eq('category_type', 'invoice')
      .eq('site_id', siteId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
    if (error) throw error
    const documents = Array.isArray(data) ? data : []

    const grouped: Record<string, any[]> = {}
    for (const r of documents) {
      const derivedDocType =
        r?.document_type ||
        r?.metadata?.doc_type ||
        r?.metadata?.document_type ||
        r?.sub_category ||
        'other'
      const status = r.status || 'active'
      if (status === 'deleted' || status === 'archived') continue
      if (docType && derivedDocType !== docType) continue
      const list = (grouped[derivedDocType] = grouped[derivedDocType] || [])
      list.push({
        id: r.id,
        title: r.title || r.file_name || '',
        file_url: r.file_url,
        file_name: r.file_name,
        mime_type: r.mime_type,
        uploaded_by: r.uploaded_by,
        uploader_name: r?.uploader?.full_name || null,
        created_at: r.created_at,
        stage: r?.metadata?.stage || null,
        metadata: r.metadata || null,
        status: r.status || 'active',
      })
    }

    if (!includeHistory) {
      for (const key of Object.keys(grouped)) {
        grouped[key] = grouped[key]
          .sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          .slice(0, 1)
      }
    }

    const activeTypes = docTypes
      .filter(t => t.isActive !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))

    const stageProgress: Record<
      'start' | 'progress' | 'completion',
      { required: number; fulfilled: number }
    > = {
      start: { required: 0, fulfilled: 0 },
      progress: { required: 0, fulfilled: 0 },
      completion: { required: 0, fulfilled: 0 },
    }

    for (const type of activeTypes) {
      const hasDoc = (grouped[type.code] || []).length > 0
      if (type.required.start) {
        stageProgress.start.required += 1
        if (hasDoc) stageProgress.start.fulfilled += 1
      }
      if (type.required.progress) {
        stageProgress.progress.required += 1
        if (hasDoc) stageProgress.progress.fulfilled += 1
      }
      if (type.required.completion) {
        stageProgress.completion.required += 1
        if (hasDoc) stageProgress.completion.fulfilled += 1
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
  } catch (e: any) {
    console.error('[invoice/site]', ctx.params.siteId, 'error', e?.message || e)
    return NextResponse.json(
      { success: false, data: { documents: {}, docTypes: [] } },
      { status: 500 }
    )
  }
}
