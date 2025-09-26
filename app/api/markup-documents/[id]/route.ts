import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

// GET /api/markup-documents/[id] - 특정 마킹 도면 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 먼저 unified_document_system에서 문서 조회
    const { data: document, error } = await supabase
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
      const { data: legacyDocument, error: legacyError } = await supabase
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

    return NextResponse.json({
      success: true,
      data: document,
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

    const body = await request.json()
    const { title, description, markup_data, preview_image_url } = body

    // 마킹 개수 계산
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    // markup_documents 테이블 업데이트
    const { data: document, error } = await (supabase
      .from('markup_documents')
      .update({
        title,
        description,
        markup_data,
        preview_image_url,
        markup_count,
        updated_at: new Date().toISOString(),
      } as unknown)
      .eq('id', params.id)
      .select()
      .single() as unknown)

    if (error) {
      console.error('Error updating markup document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // unified_document_system도 함께 업데이트
    try {
      const { error: unifiedError } = await supabase
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

    return NextResponse.json({
      success: true,
      data: document,
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
    const body = await request.json()

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body && typeof body.linked_worklog_id === 'string') {
      updatePayload['linked_worklog_id'] = body.linked_worklog_id
    }

    if (Object.keys(updatePayload).length === 1) {
      // only updated_at — nothing to do
      return NextResponse.json({ success: true })
    }

    const { data: updated, error } = await supabase
      .from('markup_documents')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error patching markup document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // unified_document_system 메타데이터에도 링크 정보 기록(가능한 경우)
    try {
      if (body && typeof body.linked_worklog_id === 'string') {
        await supabase
          .from('unified_document_system')
          .update({
            metadata: {
              source_table: 'markup_documents',
              source_id: params.id,
              linked_worklog_id: body.linked_worklog_id,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('metadata->>source_table', 'markup_documents')
          .eq('metadata->>source_id', params.id)
      }
    } catch (syncError) {
      console.warn('Warning: Failed to sync patch to unified document system:', syncError)
    }

    return NextResponse.json({ success: true, data: updated })
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

    // markup_documents 테이블에서 소프트 삭제
    const { error } = await (supabase
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
      const { error: unifiedError } = await supabase
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
