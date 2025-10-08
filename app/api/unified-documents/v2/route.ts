import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

export const dynamic = 'force-dynamic'

// GET /api/unified-documents/v2 - 통합 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 사용자 프로필 및 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, customer_company_id, full_name')
      .eq('id', authResult.userId)
      .single()
    const role = profile.role || authResult.role || ''

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const categoryType = searchParams.get('category_type')
    const documentType = searchParams.get('document_type')
    const siteId = searchParams.get('site_id')
    const status = searchParams.get('status') || 'active'
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const includeStats = searchParams.get('include_stats') === 'true'
    const organizationId = searchParams.get('organization_id') || undefined

    const offset = (page - 1) * limit

    // 기본 쿼리 생성
    let query = supabase.from('unified_documents').select(
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
        )
      `,
      { count: 'exact' }
    )

    // 역할 기반 필터링
    if (role === 'customer_manager') {
      // 제한 계정(시공업체 담당): 자사 문서 + 공개 문서(회사서류함 등) 열람 허용
      // OR 조건: customer_company_id = 내 회사 OR is_public = true
      query = query.or(`customer_company_id.eq.${profile.customer_company_id},is_public.eq.true`)
    }
    // 작업자, 현장관리자, 관리자는 모든 문서 접근 가능 (필터링 없음)

    // 상태 필터
    if (status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['active', 'draft', 'pending'])
      } else {
        query = query.eq('status', status)
      }
    }

    // 카테고리 필터
    if (categoryType && categoryType !== 'all') {
      query = query.eq('category_type', categoryType)
    }

    // 조직(시공사) 필터
    if (organizationId && organizationId !== 'all') {
      query = query.eq('customer_company_id', organizationId)
    }

    // 문서 타입 필터
    if (documentType && documentType !== 'all') {
      query = query.eq('document_type', documentType)
    }

    // 현장 필터
    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId)
    }

    // 검색어 필터
    if (search) {
      query = query.or(`
        title.ilike.%${search}%,
        description.ilike.%${search}%,
        file_name.ilike.%${search}%
      `)
    }

    // 정렬
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: documents, error, count } = await query

    if (error) {
      console.error('Error fetching unified documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // 통계 정보 조회 (선택적)
    let statistics = null
    if (includeStats) {
      const { data: stats } = await supabase.rpc('get_document_statistics')
      statistics = stats?.[0] || null
    }

    // 상태별 카운트(현재 필터와 동일 조건) — 승인/대기/반려 기준
    const buildCount = async (statusValue: string) => {
      let cq = supabase.from('unified_documents').select('*', { count: 'exact', head: true })
      // 역할 필터
      if (role === 'customer_manager') {
        cq = cq.eq('customer_company_id', profile.customer_company_id)
      }
      // 동일 필터 재적용
      if (statusValue) cq = cq.eq('status', statusValue)
      if (categoryType && categoryType !== 'all') cq = cq.eq('category_type', categoryType)
      if (documentType && documentType !== 'all') cq = cq.eq('document_type', documentType)
      if (organizationId && organizationId !== 'all')
        cq = cq.eq('customer_company_id', organizationId)
      if (siteId && siteId !== 'all') cq = cq.eq('site_id', siteId)
      if (search)
        cq = cq.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`
        )
      const { count: c } = await cq
      return c || 0
    }
    const statusBreakdown = {
      approved: await buildCount('approved'),
      pending: await buildCount('pending'),
      rejected: await buildCount('rejected'),
    }

    // 카테고리 정보 조회
    const { data: categories } = await supabase
      .from('document_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    return NextResponse.json({
      success: true,
      data: documents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      categories: categories || [],
      statistics,
      statusBreakdown,
      user: {
        id: profile.id,
        role,
        name: profile.full_name,
        company_id: profile.customer_company_id,
      },
    })
  } catch (error) {
    console.error('Unified documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/unified-documents/v2 - 새 문서 생성
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // 제한 계정(시공업체 담당)인 경우 자사 문서만 생성 가능
    if (profile.role === 'customer_manager') {
      body.customer_company_id = profile.customer_company_id
    }

    // 필수 필드 설정
    const documentData = {
      ...body,
      uploaded_by: authResult.userId,
      status: body.status || 'active',
      workflow_status: body.workflow_status || 'draft',
      is_public: body.is_public ?? false,
      is_archived: body.is_archived ?? false,
      access_level: body.access_level || 'role',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 문서 생성
    const { data: document, error } = await supabase
      .from('unified_documents')
      .insert(documentData)
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

    if (error) {
      console.error('Error creating document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // 문서 이력 기록
    await supabase.from('document_history').insert({
      document_id: document.id,
      action: 'created',
      changed_by: authResult.userId,
      changes: documentData,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error('Document creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/unified-documents/v2 - 문서 일괄 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { action, documentIds, updateData } = await request.json()

    if (!action || !documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }

    let result

    const role = authResult.role || ''

    switch (action) {
      case 'delete': {
        // 소프트 삭제
        result = await supabase
          .from('unified_documents')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      case 'archive': {
        // 보관
        result = await supabase
          .from('unified_documents')
          .update({
            is_archived: true,
            status: 'archived',
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      case 'restore': {
        // 복원
        result = await supabase
          .from('unified_documents')
          .update({
            is_archived: false,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      case 'approve': {
        // 승인 (관리자만)
        if (!['admin', 'system_admin'].includes(role)) {
          return NextResponse.json(
            { error: 'Only administrators can approve documents' },
            { status: 403 }
          )
        }
        result = await supabase
          .from('unified_documents')
          .update({
            workflow_status: 'approved',
            approved_by: authResult.userId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      case 'reject': {
        // 반려 (관리자만)
        if (!['admin', 'system_admin'].includes(role)) {
          return NextResponse.json(
            { error: 'Only administrators can reject documents' },
            { status: 403 }
          )
        }
        result = await supabase
          .from('unified_documents')
          .update({
            workflow_status: 'rejected',
            status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      case 'change_category': {
        // 카테고리 변경
        if (!updateData?.category_type) {
          return NextResponse.json({ error: 'Category type is required' }, { status: 400 })
        }
        result = await supabase
          .from('unified_documents')
          .update({
            category_type: updateData.category_type,
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      case 'update': {
        // 일반 업데이트
        result = await supabase
          .from('unified_documents')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .in('id', documentIds)
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (result.error) {
      console.error('Bulk update error:', result.error)
      return NextResponse.json({ error: 'Failed to update documents' }, { status: 500 })
    }

    // 이력 기록
    for (const docId of documentIds) {
      await supabase.from('document_history').insert({
        document_id: docId,
        action,
        changed_by: authResult.userId,
        changes: updateData || { action },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
    }

    return NextResponse.json({
      success: true,
      message: `${documentIds.length} documents updated successfully`,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
