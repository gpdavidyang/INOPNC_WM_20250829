import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { id } = params

    const role = authResult.role || ''

    // 문서 조회 (관계 데이터 포함)
    let query = supabase
      .from('unified_document_system')
      .select(`
        *,
        owner:owner_id!left (
          id,
          full_name,
          email,
          role
        ),
        uploader:uploaded_by!left (
          id,
          full_name,
          email,
          role
        ),
        site:site_id!left (
          id,
          name,
          address,
          status
        ),
        customer_company:customer_company_id!left (
          id,
          name,
          company_type
        ),
        daily_report:daily_report_id!left (
          id,
          report_date,
          status
        ),
        category_info:category_type!left (
          category_type,
          display_name_ko,
          display_name_en,
          description,
          icon,
          color
        )
      `)
      .eq('id', id)

    // 권한 기반 필터링
    if (role !== 'admin') {
      if (role === 'supervisor') {
        query = query.or(`is_public.eq.true,owner_id.eq.${authResult.userId},uploaded_by.eq.${authResult.userId}`)
      } else {
        query = query.or(`owner_id.eq.${authResult.userId},uploaded_by.eq.${authResult.userId},is_public.eq.true`)
      }
    }

    const { data: document, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
      }
      console.error('Document query error:', error)
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    const role = authResult.role || ''

    // 문서 존재 및 권한 확인
    const { data: document, error: fetchError } = await supabase
      .from('unified_document_system')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 권한 확인
    if (role !== 'admin' && document.owner_id !== authResult.userId && document.uploaded_by !== authResult.userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // 메타데이터 병합 처리
    const updateData = { ...body }
    if (body.metadata) {
      updateData.metadata = {
        ...document.metadata,
        ...body.metadata
      }
    }

    // 업데이트 실행
    const { data: updatedDocument, error: updateError } = await supabase
      .from('unified_document_system')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        owner:owner_id!left (
          id,
          full_name,
          email,
          role
        ),
        uploader:uploaded_by!left (
          id,
          full_name,
          email,
          role
        ),
        site:site_id!left (
          id,
          name,
          address,
          status
        )
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { id } = params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    const role = authResult.role || ''

    // 문서 존재 및 권한 확인
    const { data: document, error: fetchError } = await supabase
      .from('unified_document_system')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 권한 확인 (hard delete는 관리자만 가능)
    if (hardDelete && role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required for permanent deletion' }, { status: 403 })
    }

    if (!hardDelete && role !== 'admin' && document.owner_id !== authResult.userId && document.uploaded_by !== authResult.userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    if (hardDelete) {
      // 물리적 삭제
      const { error: deleteError } = await supabase
        .from('unified_document_system')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Hard delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }

      // 저장소에서 파일 삭제
      if (document.file_path) {
        await supabase.storage.from('documents').remove([document.file_path])
      }

      return NextResponse.json({
        success: true,
        message: 'Document permanently deleted'
      })
    } else {
      // 소프트 삭제
      const { data: deletedDocument, error: deleteError } = await supabase
        .from('unified_document_system')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (deleteError) {
        console.error('Soft delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: deletedDocument,
        message: 'Document moved to trash'
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
