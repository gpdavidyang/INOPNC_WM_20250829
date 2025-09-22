import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const body = await request.json()
    const { action, documentIds, updateData } = body

    const role = authResult.role || ''

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs required' }, { status: 400 })
    }

    // 문서 존재 및 권한 확인
    let documentsQuery = supabase
      .from('unified_document_system')
      .select('id, owner_id, uploaded_by, title')
      .in('id', documentIds)

    // 권한 기반 필터링
    if (role !== 'admin') {
      if (role === 'supervisor') {
        documentsQuery = documentsQuery.or(`is_public.eq.true,owner_id.eq.${authResult.userId},uploaded_by.eq.${authResult.userId}`)
      } else {
        documentsQuery = documentsQuery.or(`owner_id.eq.${authResult.userId},uploaded_by.eq.${authResult.userId},is_public.eq.true`)
      }
    }

    const { data: documents, error: fetchError } = await documentsQuery

    if (fetchError || !documents || documents.length === 0) {
      return NextResponse.json({ error: 'Documents not found or access denied' }, { status: 404 })
    }

    // 찾은 문서 ID와 요청된 ID 비교
    const foundIds = documents.map((d: unknown) => d.id)
    const missingIds = documentIds.filter((id: unknown) => !foundIds.includes(id))
    
    if (missingIds.length > 0) {
      return NextResponse.json({ 
        error: `Access denied or documents not found: ${missingIds.join(', ')}` 
      }, { status: 403 })
    }

    let result

    switch (action) {
      case 'delete': {
        // 대량 소프트 삭제
        const { data: deletedDocuments, error: deleteError } = await supabase
          .from('unified_document_system')
          .update({ 
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .in('id', foundIds)
          .select('id, title')

        if (deleteError) {
          console.error('Bulk delete error:', deleteError)
          return NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 })
        }

        result = {
          action: 'delete',
          affected_documents: deletedDocuments?.length || 0,
          documents: deletedDocuments
        }
        break

}
      case 'archive': {
        // 대량 아카이브
        const { data: archivedDocuments, error: archiveError } = await supabase
          .from('unified_document_system')
          .update({ 
            is_archived: true,
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .in('id', foundIds)
          .select('id, title')

        if (archiveError) {
          console.error('Bulk archive error:', archiveError)
          return NextResponse.json({ error: 'Failed to archive documents' }, { status: 500 })
        }

        result = {
          action: 'archive',
          affected_documents: archivedDocuments?.length || 0,
          documents: archivedDocuments
        }
        break

}
      case 'restore': {
        // 대량 복구
        const { data: restoredDocuments, error: restoreError } = await supabase
          .from('unified_document_system')
          .update({ 
            is_archived: false,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .in('id', foundIds)
          .select('id, title')

        if (restoreError) {
          console.error('Bulk restore error:', restoreError)
          return NextResponse.json({ error: 'Failed to restore documents' }, { status: 500 })
        }

        result = {
          action: 'restore',
          affected_documents: restoredDocuments?.length || 0,
          documents: restoredDocuments
        }
        break

}
      case 'update': {
        // 대량 업데이트
        if (!updateData) {
          return NextResponse.json({ error: 'Update data required' }, { status: 400 })
        }

        const { data: updatedDocuments, error: updateError } = await supabase
          .from('unified_document_system')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .in('id', foundIds)
          .select('id, title')

        if (updateError) {
          console.error('Bulk update error:', updateError)
          return NextResponse.json({ error: 'Failed to update documents' }, { status: 500 })
        }

        result = {
          action: 'update',
          affected_documents: updatedDocuments?.length || 0,
          documents: updatedDocuments,
          update_data: updateData
        }
        break

}
      case 'change_category': {
        // 카테고리 변경
        const { category_type, sub_category } = updateData || {}
        
        if (!category_type) {
          return NextResponse.json({ error: 'category_type required for category change' }, { status: 400 })
        }

        const { data: categoryChangedDocuments, error: categoryError } = await supabase
          .from('unified_document_system')
          .update({
            category_type,
            sub_category,
            updated_at: new Date().toISOString()
          })
          .in('id', foundIds)
          .select('id, title, category_type, sub_category')

        if (categoryError) {
          console.error('Bulk category change error:', categoryError)
          return NextResponse.json({ error: 'Failed to change document categories' }, { status: 500 })
        }

        result = {
          action: 'change_category',
          affected_documents: categoryChangedDocuments?.length || 0,
          documents: categoryChangedDocuments,
          new_category: { category_type, sub_category }
        }
        break

}
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const body = await request.json()
    const { id, action, ...actionData } = body

    // 특별한 작업들 처리
    switch (action) {
      case 'approve': {
        // 문서 승인
        if (!actionData.approved_by) {
          actionData.approved_by = authResult.userId
        }
        actionData.approved_at = new Date().toISOString()
        actionData.status = 'active'
        break

}
      case 'reject': {
        // 문서 거부
        actionData.status = 'rejected'
        actionData.approved_by = authResult.userId
        actionData.approved_at = new Date().toISOString()
        break

}
      case 'share': {
        // 문서 공유
        actionData.is_public = true
        break

}
      case 'unshare': {
        // 문서 공유 해제
        actionData.is_public = false
        break

}
      case 'add_markup': {
        // 마킹 데이터 추가
        const { markup_data } = actionData
        if (!markup_data) {
          return NextResponse.json({ error: 'Markup data required' }, { status: 400 })
        }

        // 기존 마킹 데이터와 병합
        const { data: currentDoc } = await supabase
          .from('unified_document_system')
          .select('markup_data')
          .eq('id', id)
          .single()

        actionData.markup_data = [
          ...(currentDoc?.markup_data || []),
          ...markup_data
        ]
        break
        }
    }

    // 업데이트 실행
    const { data: updatedDocument, error: updateError } = await supabase
      .from('unified_document_system')
      .update({
        ...actionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Action update error:', updateError)
      return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      action
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
