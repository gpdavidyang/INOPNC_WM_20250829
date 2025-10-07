import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

// GET /api/unified-documents/v2/[id] - 개별 문서 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 사용자 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, customer_company_id')
      .eq('id', authResult.userId)
      .single()
    const role = profile.role || authResult.role || ''

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 문서 조회
    let query = supabase
      .from('unified_documents')
      .select(
        `
        *,
        uploader:uploaded_by (
          id,
          full_name,
          email,
          role
        ),
        site:site_id (
          id,
          name,
          address,
          status
        ),
        customer_company:customer_company_id (
          id,
          name,
          company_type
        ),
        daily_report:daily_report_id (
          id,
          report_date,
          status
        ),
        approver:approved_by (
          id,
          full_name,
          email
        )
      `
      )
      .eq('id', params.id)
      .single()

    const { data: document, error } = await query

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 제한 계정(시공업체 담당) 접근 권한 확인
    if (role === 'customer_manager') {
      if (document.customer_company_id !== profile.customer_company_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // 접근 로그 기록
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      accessed_by: authResult.userId,
      action: 'view',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    // 문서 이력 조회
    const { data: history } = await supabase
      .from('document_history')
      .select(
        `
        *,
        user:changed_by (
          id,
          full_name,
          email
        )
      `
      )
      .eq('document_id', params.id)
      .order('changed_at', { ascending: false })
      .limit(10)

    // 최근 접근 로그 조회 (있을 경우)
    let accessLogs: Array<{ created_at?: string; action?: string; accessed_by?: string }> = []
    try {
      const { data: logs } = await supabase
        .from('document_access_logs')
        .select('created_at, action, accessed_by')
        .eq('document_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10)
      accessLogs = logs || []
    } catch (_) {
      accessLogs = []
    }

    return NextResponse.json({
      success: true,
      data: document,
      history: history || [],
      accessLogs,
    })
  } catch (error) {
    console.error('Document fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/unified-documents/v2/[id] - 문서 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 사용자 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, customer_company_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 기존 문서 조회
    const { data: existingDoc } = await supabase
      .from('unified_documents')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 권한 확인
    const role = profile.role || authResult.role || ''
    const isAdmin = ['admin', 'system_admin'].includes(role)
    const isOwner = existingDoc.uploaded_by === authResult.userId
    const isGeneralUser = ['worker', 'site_manager'].includes(role)
    const isPartner = role === 'customer_manager'

    // 제한 계정(시공업체 담당)은 자사 문서만 수정 가능
    if (isPartner && existingDoc.customer_company_id !== profile.customer_company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const updateData = await request.json()

    // 승인 관련 필드는 관리자만 수정 가능
    const approvalFields = ['approved_by', 'approved_at', 'workflow_status']
    const hasApprovalChanges = approvalFields.some(field => field in updateData)

    if (hasApprovalChanges && !isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can modify approval fields' },
        { status: 403 }
      )
    }

    // 일반 사용자는 자신의 문서 또는 공유 문서만 수정 가능
    if (!isAdmin && !isOwner) {
      if (
        !isGeneralUser ||
        !['shared', 'markup', 'photo_grid'].includes(existingDoc.category_type)
      ) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this document' },
          { status: 403 }
        )
      }
    }

    // 버전 관리: 중요 변경시 버전 증가
    const significantFields = ['file_url', 'title', 'category_type', 'document_type']
    const hasSignificantChanges = significantFields.some(
      field => field in updateData && updateData[field] !== existingDoc[field]
    )

    if (hasSignificantChanges) {
      updateData.version = (existingDoc.version || 1) + 1
      updateData.parent_document_id = existingDoc.parent_document_id || existingDoc.id
    }

    // 업데이트 실행
    const { data: updatedDoc, error: updateError } = await supabase
      .from('unified_documents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(
        `
        *,
        uploader:uploaded_by (
          id,
          full_name,
          email,
          role
        )
      `
      )
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // 변경 이력 기록
    const changes: unknown = {}
    Object.keys(updateData).forEach(key => {
      if (existingDoc[key] !== updateData[key]) {
        changes[key] = {
          old: existingDoc[key],
          new: updateData[key],
        }
      }
    })

    await supabase.from('document_history').insert({
      document_id: params.id,
      action: 'updated',
      changed_by: authResult.userId,
      changes,
      comment: updateData.update_comment,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      data: updatedDoc,
    })
  } catch (error) {
    console.error('Document update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/unified-documents/v2/[id] - 문서 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, customer_company_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 기존 문서 조회
    const { data: existingDoc } = await supabase
      .from('unified_documents')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 권한 확인
    const role = profile.role || authResult.role || ''
    const isAdmin = ['admin', 'system_admin'].includes(role)
    const isOwner = existingDoc.uploaded_by === authResult.userId

    // 관리자가 아니면 자신의 문서만 삭제 가능
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this document' },
        { status: 403 }
      )
    }

    // 승인된 문서는 관리자만 삭제 가능
    if (existingDoc.workflow_status === 'approved' && !isAdmin) {
      return NextResponse.json(
        { error: 'Approved documents can only be deleted by administrators' },
        { status: 403 }
      )
    }

    if (hardDelete && isAdmin) {
      // 하드 삭제 (관리자만)
      const { error: deleteError } = await supabase
        .from('unified_documents')
        .delete()
        .eq('id', params.id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }

      // Storage에서 파일도 삭제
      if (existingDoc.file_url) {
        try {
          const urlParts = existingDoc.file_url.split('/storage/v1/object/public/')
          if (urlParts.length > 1) {
            const [bucket, ...pathParts] = urlParts[1].split('/')
            const path = pathParts.join('/')
            await supabase.storage.from(bucket).remove([path])
          }
        } catch (storageError) {
          console.error('Storage deletion error:', storageError)
          // 파일 삭제 실패는 무시 (DB 삭제는 성공)
        }
      }
    } else {
      // 소프트 삭제
      const { error: updateError } = await supabase
        .from('unified_documents')
        .update({
          status: 'deleted',
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (updateError) {
        console.error('Soft delete error:', updateError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }
    }

    // 삭제 이력 기록
    await supabase.from('document_history').insert({
      document_id: params.id,
      action: hardDelete ? 'hard_deleted' : 'deleted',
      changed_by: authResult.userId,
      comment: `Document ${hardDelete ? 'permanently' : 'soft'} deleted`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: `Document ${hardDelete ? 'permanently' : ''} deleted successfully`,
    })
  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
