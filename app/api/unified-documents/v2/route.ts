import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  role?: string | null
  full_name?: string | null
  customer_company_id?: string | null
}

async function loadProfileWithCompany(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ profile: ProfileRow | null; error: Error | null; companyId: string | null }> {
  const baseColumns = 'id, role, full_name'
  const preferredColumns = `${baseColumns}, customer_company_id`
  const fallbackColumns = `${baseColumns}, organization_id`

  const fetchProfile = (columns: string) =>
    supabase.from('profiles').select(columns).eq('id', userId).maybeSingle()

  let { data, error } = await fetchProfile(preferredColumns)
  if (error) {
    const message = error.message?.toLowerCase() ?? ''
    if (message.includes('customer_company_id')) {
      const retry = await fetchProfile(fallbackColumns)
      if (retry.data) {
        const normalized = {
          ...retry.data,
          customer_company_id: (retry.data as any)?.organization_id ?? null,
        }
        return {
          profile: normalized,
          error: null,
          companyId: normalized.customer_company_id ?? null,
        }
      }
      return { profile: null, error: retry.error ?? error, companyId: null }
    }
    return { profile: null, error, companyId: null }
  }

  return {
    profile: (data as ProfileRow) ?? null,
    error: null,
    companyId: (data as ProfileRow | null)?.customer_company_id ?? null,
  }
}

// GET /api/unified-documents/v2 - 통합 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const {
      profile,
      error: profileError,
      companyId: resolvedCompanyId,
    } = await loadProfileWithCompany(supabase, authResult.userId)

    if (profileError) {
      console.error('Unified documents profile lookup failed:', profileError)
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const role = profile.role || authResult.role || ''

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
    const ascending = sortOrder === 'asc'
    let customerCompanyColumnAvailable = true
    {
      const { error: columnCheckError } = await supabase
        .from('unified_documents')
        .select('customer_company_id')
        .limit(1)
      if (
        columnCheckError &&
        columnCheckError.message?.toLowerCase().includes('customer_company_id')
      ) {
        customerCompanyColumnAvailable = false
        console.warn(
          '[Unified documents] customer_company_id column missing; company-specific filters disabled'
        )
      }
    }
    let loggedMissingCompanyFilter = false

    const applyFilters = (builder: any) => {
      let q = builder

      if (role === 'customer_manager') {
        if (customerCompanyColumnAvailable && resolvedCompanyId) {
          q = q.or(`customer_company_id.eq.${resolvedCompanyId},is_public.eq.true`)
        } else {
          q = q.eq('is_public', true)
        }
      }

      if (status !== 'all') {
        if (status === 'active') {
          q = q.in('status', ['active', 'draft', 'pending'])
        } else {
          q = q.eq('status', status)
        }
      }

      if (categoryType && categoryType !== 'all') {
        q = q.eq('category_type', categoryType)
      }

      if (organizationId && organizationId !== 'all') {
        if (customerCompanyColumnAvailable) {
          q = q.eq('customer_company_id', organizationId)
        } else if (!loggedMissingCompanyFilter) {
          console.warn(
            '[Unified documents] organization filter skipped because customer_company_id column is unavailable'
          )
          loggedMissingCompanyFilter = true
        }
      }

      if (documentType && documentType !== 'all') {
        q = q.eq('document_type', documentType)
      }

      if (siteId && siteId !== 'all') {
        q = q.eq('site_id', siteId)
      }

      if (search) {
        q = q.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`
        )
      }

      return q.order(sortBy, { ascending })
    }

    const customerCompanySelect = customerCompanyColumnAvailable
      ? `,
        customer_company:customer_company_id (
          id
        )`
      : ''

    const richSelect = `
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
        )${customerCompanySelect},
        daily_report:daily_report_id (
          id,
          report_date,
          status
        )
      `

    const buildQuery = (selectClause: string) =>
      applyFilters(
        supabase.from('unified_documents').select(selectClause, { count: 'exact' })
      ).range(offset, offset + limit - 1)

    let documents: any[] | null = null
    let count: number | null = null
    {
      const { data, error, count: c } = await buildQuery(richSelect)
      if (error) {
        console.warn(
          'Unified documents: relationship select failed, falling back to minimal fields.',
          error?.message || error
        )
        // 1차 폴백: 동일 테이블 최소 셀렉트 (동일 필터 유지)
        const fallbackQuery = await buildQuery('*')
        if (!fallbackQuery.error) {
          documents = fallbackQuery.data || []
          count = fallbackQuery.count || 0
        } else {
          // 2차 폴백: 레거시 unified_document_system에서 호환 필드 구성
          console.warn(
            'Unified documents primary fallback failed, trying unified_document_system',
            fallbackQuery.error?.message || fallbackQuery.error
          )
          const legacy = await supabase
            .from('unified_document_system')
            .select('*', { count: 'exact' })
          if (legacy.error) {
            console.error('Unified documents legacy fallback error:', legacy.error)
            // Final fail-soft: return empty list so UI doesn't break
            documents = []
            count = 0
          } else {
            documents = (legacy.data || []).map((d: any) => ({
              id: d.id,
              title: d.title || d.file_name,
              description: d.description ?? null,
              file_name: d.file_name,
              file_url: d.file_url,
              document_type: d.document_type || d.category_type || null,
              sub_type: d.sub_type || null,
              status: d.status,
              site_id: d.site_id,
              created_at: d.created_at,
              uploaded_by: d.uploaded_by,
              is_public: d.is_public === true,
            }))
            count = legacy.count || 0
          }
        }
      } else {
        documents = data || []
        count = c || 0
      }
    }

    // 통계 정보 조회 (선택적)
    let statistics = null
    if (includeStats) {
      try {
        const { data: stats } = await supabase.rpc('get_document_statistics')
        statistics = stats?.[0] || null
      } catch (_) {
        statistics = null
      }
    }

    // 상태별 카운트(현재 필터와 동일 조건) — 승인/대기/반려 기준
    const buildCount = async (statusValue: string) => {
      try {
        let cq = supabase.from('unified_documents').select('*', { count: 'exact', head: true })
        if (role === 'customer_manager') {
          if (customerCompanyColumnAvailable && resolvedCompanyId) {
            cq = cq.eq('customer_company_id', resolvedCompanyId)
          } else {
            cq = cq.eq('is_public', true)
          }
        }
        if (statusValue) cq = cq.eq('status', statusValue)
        if (categoryType && categoryType !== 'all') cq = cq.eq('category_type', categoryType)
        if (documentType && documentType !== 'all') cq = cq.eq('document_type', documentType)
        if (organizationId && organizationId !== 'all') {
          if (customerCompanyColumnAvailable) {
            cq = cq.eq('customer_company_id', organizationId)
          }
        }
        if (siteId && siteId !== 'all') cq = cq.eq('site_id', siteId)
        if (search)
          cq = cq.or(
            `title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`
          )
        const { count: c } = await cq
        return c || 0
      } catch (_) {
        return 0
      }
    }
    const statusBreakdown = {
      approved: await buildCount('approved'),
      pending: await buildCount('pending'),
      rejected: await buildCount('rejected'),
    }

    // 카테고리 정보 조회
    let categories = null
    try {
      const { data } = await supabase
        .from('document_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      categories = data || []
    } catch (_) {
      categories = []
    }

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
        company_id: resolvedCompanyId,
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

    const {
      profile,
      error: profileError,
      companyId: resolvedCompanyId,
    } = await loadProfileWithCompany(supabase, authResult.userId)

    if (profileError) {
      console.error('Document creation profile lookup failed:', profileError)
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()

    // 제한 계정(시공업체 담당)인 경우 자사 문서만 생성 가능
    if (profile.role === 'customer_manager') {
      body.customer_company_id = resolvedCompanyId
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
