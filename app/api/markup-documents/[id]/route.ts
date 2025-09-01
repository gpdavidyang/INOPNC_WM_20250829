import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/markup-documents/[id] - 특정 마킹 도면 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 먼저 unified_document_system에서 문서 조회
    const { data: document, error } = await supabase
      .from('unified_document_system')
      .select(`
        *,
        profiles!unified_document_system_uploaded_by_fkey(full_name, email),
        sites(name)
      `)
      .eq('id', params.id)
      .eq('category_type', 'markup')
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching document from unified_document_system:', error)
      
      // 후진적 호환성을 위해 markup_documents 테이블도 확인
      const { data: legacyDocument, error: legacyError } = await supabase
        .from('markup_documents' as any)
        .select(`
          *,
          profiles!markup_documents_created_by_fkey(full_name, email),
          sites(name)
        `)
        .eq('id', params.id)
        .eq('is_deleted', false)
        .single()
      
      if (legacyError) {
        console.error('Error fetching markup document:', legacyError)
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      
      // legacy document를 새로운 형식으로 변환
      const transformedDocument = {
        ...legacyDocument,
        file_url: legacyDocument.original_blueprint_url || legacyDocument.file_url,
        original_blueprint_url: legacyDocument.original_blueprint_url,
        original_blueprint_filename: legacyDocument.original_blueprint_filename
      }
      
      return NextResponse.json({
        success: true,
        data: transformedDocument
      })
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/markup-documents/[id] - 마킹 도면 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      markup_data,
      preview_image_url
    } = body

    // 마킹 개수 계산
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    const { data: document, error } = await supabase
      .from('markup_documents' as any)
      .update({
        title,
        description,
        markup_data,
        preview_image_url,
        markup_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating markup document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/markup-documents/[id] - 마킹 도면 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('markup_documents' as any)
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting markup document:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}