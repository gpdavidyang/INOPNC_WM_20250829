import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { fetchMarkupWorklogMap, syncMarkupWorklogLinks } from '@/lib/documents/worklog-links'

export const dynamic = 'force-dynamic'

type WorklogExtractionResult = {
  provided: boolean
  ids: string[]
}

const arrayKeyCandidates = ['worklogIds', 'worklog_ids', 'linked_worklog_ids', 'daily_report_ids']
const singleKeyCandidates = ['linked_worklog_id', 'daily_report_id', 'worklogId', 'worklog_id']

const extractWorklogIds = (body: any): WorklogExtractionResult => {
  for (const key of arrayKeyCandidates) {
    const value = body?.[key]
    if (Array.isArray(value)) {
      const ids = value
        .filter((v: unknown): v is string => typeof v === 'string')
        .map(v => v.trim())
        .filter(Boolean)
      return { provided: true, ids }
    }
  }

  for (const key of singleKeyCandidates) {
    if (!Object.prototype.hasOwnProperty.call(body || {}, key)) continue
    const value = body?.[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return { provided: true, ids: trimmed ? [trimmed] : [] }
    }
    if (value === null) return { provided: true, ids: [] }
  }

  return { provided: false, ids: [] }
}

const resolveLinkedIds = async (markupId: string, primary?: string | null) => {
  if (!markupId) return primary ? [primary] : []
  try {
    const map = await fetchMarkupWorklogMap([markupId])
    const extras = map.get(markupId) || []
    const combined = primary ? [primary, ...extras] : extras
    return Array.from(new Set(combined))
  } catch (error) {
    console.warn('Failed to resolve linked worklog ids:', error)
    return primary ? [primary] : []
  }
}

// GET /api/markup-documents/[id] - 특정 마킹 도면 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const isAdmin = authResult.role === 'admin' || authResult.role === 'system_admin'
    const supabaseAdminClient = (() => {
      if (isAdmin) {
        try {
          return createServiceClient()
        } catch (error) {
          console.warn('Failed to create service client for markup PUT:', error)
        }
      }
      return null
    })()
    const markupClient = supabaseAdminClient ?? supabase

    // 1) Try canonical markup table first to include new metadata fields
    const { data: markupDoc, error: markupError } = await markupClient
      .from('markup_documents')
      .select(
        `
        *,
        creator:profiles!markup_documents_created_by_fkey(full_name, email),
        site:sites(name)
      `
      )
      .eq('id', params.id)
      .eq('is_deleted', false)
      .maybeSingle()

    if (markupDoc && !markupError) {
      const linkedWorklogIds = await resolveLinkedIds(params.id, markupDoc.linked_worklog_id)
      const primaryWorklogId = markupDoc.linked_worklog_id || linkedWorklogIds[0] || null
      let dailyReport: any = null
      if (primaryWorklogId) {
        const { data: report } = await markupClient
          .from('daily_reports')
          .select('id, work_date, member_name, status')
          .eq('id', primaryWorklogId as string)
          .maybeSingle()
        dailyReport = report || null
      }

      return NextResponse.json({
        success: true,
        data: {
          ...markupDoc,
          linked_worklog_ids: linkedWorklogIds,
          daily_report: dailyReport,
        },
      })
    }

    // 먼저 unified_document_system에서 문서 조회
    const { data: document, error } = await markupClient
      .from('unified_document_system')
      .select(
        `
        *,
        profiles!unified_document_system_uploaded_by_fkey(full_name, email),
        sites(name)
      `
      )
      .eq('id', params.id)
      .eq('category_type', 'markup')
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching document from unified_document_system:', error)

      // 후진적 호환성을 위해 markup_documents 테이블도 확인
      const { data: legacyDocument, error: legacyError } = await markupClient
        .from('markup_documents' as unknown)
        .select(
          `
          *,
          profiles!markup_documents_created_by_fkey(full_name, email),
          sites(name)
        `
        )
        .eq('id', params.id)
        .eq('is_deleted', false)
        .single()

      if (legacyError) {
        console.error('Error fetching markup document:', legacyError)
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // legacy document를 새로운 형식으로 변환
      const transformedDocument = {
        ...(legacyDocument as unknown),
        file_url:
          (legacyDocument as unknown).original_blueprint_url ||
          (legacyDocument as unknown).file_url,
        original_blueprint_url: (legacyDocument as unknown).original_blueprint_url,
        original_blueprint_filename: (legacyDocument as unknown).original_blueprint_filename,
      }

      return NextResponse.json({
        success: true,
        data: transformedDocument,
      })
    }

    let unifiedDailyReport: any = null
    const derivedWorklogId =
      (document as any).linked_worklog_id ?? (document as any)?.metadata?.daily_report_id ?? null
    const metadataObject =
      document?.metadata &&
      typeof document.metadata === 'object' &&
      !Array.isArray(document.metadata)
        ? (document.metadata as Record<string, any>)
        : {}
    const metadataLinkedIds: string[] = Array.isArray(metadataObject.linked_worklog_ids)
      ? metadataObject.linked_worklog_ids.filter(
          (id: unknown): id is string => typeof id === 'string'
        )
      : []
    const linkedWorklogIds = (() => {
      const combined = derivedWorklogId
        ? [derivedWorklogId, ...metadataLinkedIds]
        : metadataLinkedIds
      return Array.from(new Set(combined))
    })()
    if (derivedWorklogId) {
      const { data: report } = await markupClient
        .from('daily_reports')
        .select('id, work_date, member_name, status')
        .eq('id', derivedWorklogId as string)
        .maybeSingle()
      unifiedDailyReport = report || null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        linked_worklog_id: derivedWorklogId ?? null,
        linked_worklog_ids: linkedWorklogIds,
        daily_report: unifiedDailyReport,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/markup-documents/[id] - 마킹 도면 업데이트
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const isAdmin = authResult.role === 'admin' || authResult.role === 'system_admin'
    const supabaseAdminClient = (() => {
      if (isAdmin) {
        try {
          return createServiceClient()
        } catch (error) {
          console.warn('Failed to create service client for markup PUT:', error)
        }
      }
      return null
    })()
    const supabaseForDocs = supabaseAdminClient ?? supabase

    const body = await request.json()
    const { title, description, markup_data, preview_image_url } = body
    const hasSiteIdField = Object.prototype.hasOwnProperty.call(body, 'site_id')
    const normalizedSiteId =
      hasSiteIdField && typeof body.site_id === 'string' && body.site_id.trim().length > 0
        ? body.site_id.trim()
        : hasSiteIdField && body.site_id === null
          ? null
          : undefined
    const { provided: worklogIdsProvided, ids: normalizedWorklogIds } = extractWorklogIds(body)
    const primaryWorklogId = normalizedWorklogIds[0] ?? null

    // 마킹 개수 계산
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    // markup_documents 테이블 업데이트
    const updatePayload: Record<string, unknown> = {
      title,
      description,
      markup_data,
      preview_image_url,
      markup_count,
      updated_at: new Date().toISOString(),
    }

    if (hasSiteIdField) {
      updatePayload.site_id = normalizedSiteId ?? null
    }
    if (worklogIdsProvided) {
      updatePayload.linked_worklog_id = primaryWorklogId
    }

    const { data: document, error } = await (supabaseForDocs
      .from('markup_documents')
      .update(updatePayload as unknown)
      .eq('id', params.id)
      .select()
      .single() as unknown)

    if (error) {
      console.error('Error updating markup document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    if (worklogIdsProvided) {
      try {
        await syncMarkupWorklogLinks(params.id, normalizedWorklogIds)
      } catch (linkError) {
        console.warn('Failed to sync markup worklog links in PUT:', linkError)
      }
    }

    // unified_document_system도 함께 업데이트
    try {
      const { error: unifiedError } = await (supabaseAdminClient ?? supabase)
        .from('unified_document_system')
        .update({
          title,
          description,
          file_name: `${title}.markup`,
          updated_at: new Date().toISOString(),
          metadata: {
            source_table: 'markup_documents',
            source_id: document.id,
            markup_count,
            original_blueprint_url: document.original_blueprint_url,
            original_blueprint_filename: document.original_blueprint_filename,
            daily_report_id: worklogIdsProvided
              ? primaryWorklogId
              : (document.linked_worklog_id ?? null),
            linked_worklog_ids: worklogIdsProvided ? normalizedWorklogIds : undefined,
            site_id: hasSiteIdField ? (normalizedSiteId ?? null) : (document.site_id ?? null),
          },
        })
        .eq('metadata->>source_table', 'markup_documents')
        .eq('metadata->>source_id', params.id)

      if (unifiedError) {
        console.warn('Warning: Failed to sync update to unified document system:', unifiedError)
      }
    } catch (syncError) {
      console.warn('Warning: Error syncing update to unified document system:', syncError)
    }

    const linkedWorklogIds = await resolveLinkedIds(params.id, document.linked_worklog_id)

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        linked_worklog_ids: linkedWorklogIds,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/markup-documents/[id] - 부분 업데이트(예: 작업일지 링크)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const isAdmin = authResult.role === 'admin' || authResult.role === 'system_admin'
    const supabaseAdminClient = (() => {
      if (isAdmin) {
        try {
          return createServiceClient()
        } catch (error) {
          console.warn('Failed to create service client for markup PATCH:', error)
        }
      }
      return null
    })()
    const supabaseForDocs = supabaseAdminClient ?? supabase
    const body = await request.json()

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const { provided: worklogIdsProvided, ids: normalizedWorklogIds } = extractWorklogIds(body)
    if (worklogIdsProvided) {
      updatePayload['linked_worklog_id'] = normalizedWorklogIds[0] ?? null
    }

    if (
      body &&
      Object.prototype.hasOwnProperty.call(body, 'title') &&
      typeof body.title === 'string'
    ) {
      updatePayload['title'] = body.title
    }

    if (
      body &&
      Object.prototype.hasOwnProperty.call(body, 'description') &&
      typeof body.description === 'string'
    ) {
      updatePayload['description'] = body.description
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'site_id')) {
      if (typeof body.site_id === 'string' && body.site_id.trim().length > 0) {
        updatePayload['site_id'] = body.site_id.trim()
      } else if (body.site_id === null) {
        updatePayload['site_id'] = null
      }
    }

    if (Object.keys(updatePayload).length === 1) {
      // only updated_at — nothing to do
      return NextResponse.json({ success: true })
    }

    const { data: updated, error } = await supabaseForDocs
      .from('markup_documents')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error patching markup document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    if (worklogIdsProvided) {
      try {
        await syncMarkupWorklogLinks(params.id, normalizedWorklogIds)
      } catch (linkError) {
        console.warn('Failed to sync markup worklog links in PATCH:', linkError)
      }
    }

    // unified_document_system 메타데이터에도 변경 사항 기록(가능한 경우)
    try {
      const unifiedUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
      let shouldSync = false

      if (Object.prototype.hasOwnProperty.call(updatePayload, 'title')) {
        unifiedUpdate['title'] = updatePayload.title
        unifiedUpdate['file_name'] = `${updatePayload.title}.markup`
        shouldSync = true
      }

      if (Object.prototype.hasOwnProperty.call(updatePayload, 'description')) {
        unifiedUpdate['description'] = updatePayload.description
        shouldSync = true
      }

      const metadataPatch: Record<string, unknown> = {
        source_table: 'markup_documents',
        source_id: params.id,
        original_blueprint_url: updated.original_blueprint_url,
        original_blueprint_filename: updated.original_blueprint_filename,
      }
      let metadataChanged = false

      if (Object.prototype.hasOwnProperty.call(updatePayload, 'site_id')) {
        metadataPatch['site_id'] = updatePayload.site_id ?? null
        metadataChanged = true
      }

      if (worklogIdsProvided) {
        metadataPatch['daily_report_id'] = normalizedWorklogIds[0] ?? null
        metadataPatch['linked_worklog_ids'] = normalizedWorklogIds
        metadataChanged = true
      }

      if (metadataChanged) {
        unifiedUpdate['metadata'] = metadataPatch
        shouldSync = true
      }

      if (shouldSync) {
        await (supabaseAdminClient ?? supabase)
          .from('unified_document_system')
          .update(unifiedUpdate)
          .eq('metadata->>source_table', 'markup_documents')
          .eq('metadata->>source_id', params.id)
      }
    } catch (syncError) {
      console.warn('Warning: Failed to sync patch to unified document system:', syncError)
    }

    const linkedWorklogIds = await resolveLinkedIds(params.id, updated.linked_worklog_id)

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        linked_worklog_ids: linkedWorklogIds,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/markup-documents/[id] - 마킹 도면 삭제 (소프트 삭제)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const isAdmin = authResult.role === 'admin' || authResult.role === 'system_admin'
    const supabaseAdminClient = (() => {
      if (isAdmin) {
        try {
          return createServiceClient()
        } catch (error) {
          console.warn('Failed to create service client for markup DELETE:', error)
        }
      }
      return null
    })()
    const supabaseForDocs = supabaseAdminClient ?? supabase

    // markup_documents 테이블에서 소프트 삭제
    const { error } = await (supabaseForDocs
      .from('markup_documents')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      } as unknown)
      .eq('id', params.id) as unknown)

    if (error) {
      console.error('Error deleting markup document:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    // unified_document_system에서도 아카이브 처리
    try {
      const { error: unifiedError } = await (supabaseAdminClient ?? supabase)
        .from('unified_document_system')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('metadata->>source_table', 'markup_documents')
        .eq('metadata->>source_id', params.id)

      if (unifiedError) {
        console.warn('Warning: Failed to sync delete to unified document system:', unifiedError)
      }
    } catch (syncError) {
      console.warn('Warning: Error syncing delete to unified document system:', syncError)
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
