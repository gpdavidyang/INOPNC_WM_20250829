import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { role, restrictedOrgId } = authResult

    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const categoryType = searchParams.get('category_type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 카테고리별 접근 권한 체크
    if (categoryType) {
      // 필수서류함: 파트너사 접근 불가
      if (categoryType === 'required' && role === 'customer_manager') {
        return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
      }
      
      // 기성청구함: 작업자/현장관리자 접근 불가
      if (categoryType === 'invoice' && ['worker', 'site_manager'].includes(role)) {
        return NextResponse.json({ error: '기성청구함에 접근할 권한이 없습니다' }, { status: 403 })
      }
    }

    // Build query for unified document system - RLS will automatically filter data based on role
    let query = supabase
      .from('unified_document_system')
      .select(`
        *,
        uploader:profiles!unified_document_system_uploaded_by_fkey(
          id,
          full_name,
          role
        ),
        site:sites(
          id,
          name,
          address
        ),
        approver:profiles!unified_document_system_approved_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId)
    }
    
    if (categoryType && categoryType !== 'all') {
      query = query.eq('category_type', categoryType)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
    }

    const { data: documents, error: documentsError } = await query

    if (documentsError) {
      console.error('Documents query error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('unified_document_system')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false)

    if (siteId && siteId !== 'all') {
      countQuery = countQuery.eq('site_id', siteId)
    }
    
    if (categoryType && categoryType !== 'all') {
      countQuery = countQuery.eq('category_type', categoryType)
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
    }

    const { count: totalCount } = await countQuery

    // Get document statistics by category
    const { data: categoryStats } = await supabase
      .from('unified_document_system')
      .select('category_type')
      .eq('is_archived', false)

    const statisticsByCategory = categoryStats?.reduce((acc: unknown, doc: unknown) => {
      const category = doc.category_type
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get status statistics
    const { data: statusStats } = await supabase
      .from('unified_document_system')
      .select('status')
      .eq('is_archived', false)

    const statisticsByStatus = statusStats?.reduce((acc: unknown, doc: unknown) => {
      const docStatus = doc.status
      acc[docStatus] = (acc[docStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Group documents by category
    const documentsByCategory = documents?.reduce((acc: unknown, doc: unknown) => {
      const category = doc.category_type
      if (!acc[category]) acc[category] = []
      acc[category].push(doc)
      return acc
    }, {} as Record<string, any[]>) || {}

    // Set permissions based on user role
    const isAdmin = ['admin', 'system_admin'].includes(role)
    const isWorker = ['worker', 'site_manager'].includes(role)
    const isPartner = role === 'customer_manager'

    const response = {
      documents: documents || [],
      documents_by_category: documentsByCategory,
      statistics: {
        total_documents: totalCount || 0,
        by_category: statisticsByCategory,
        by_status: statisticsByStatus,
        shared_documents: statisticsByCategory.shared || 0,
        markup_documents: statisticsByCategory.markup || 0,
        required_documents: statisticsByCategory.required || 0,
        invoice_documents: statisticsByCategory.invoice || 0,
        photo_grid_documents: statisticsByCategory.photo_grid || 0
      },
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (totalCount || 0) > (offset + limit)
      },
      permissions: {
        can_view_all: isAdmin,
        can_download_all: isAdmin,
        can_share_all: isAdmin,
        can_edit_all: isAdmin,
        global_access: isAdmin,
        role: profile.role,
        // 역할별 접근 가능한 카테고리
        accessible_categories: isAdmin 
          ? ['shared', 'markup', 'required', 'invoice', 'photo_grid']
          : isWorker
          ? ['shared', 'markup', 'required', 'photo_grid']
          : isPartner
          ? ['shared', 'markup', 'invoice', 'photo_grid']
          : []
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching integrated documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrated documents' },
      { status: 500 }
    )
  }
}
