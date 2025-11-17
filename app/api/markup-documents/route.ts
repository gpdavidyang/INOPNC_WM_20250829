import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { uploadDataUrlToDocumentsBucket } from '@/lib/storage/data-url'
import { fetchMarkupWorklogMap, syncMarkupWorklogLinks } from '@/lib/documents/worklog-links'

export const dynamic = 'force-dynamic'

// GET /api/markup-documents - 마킹 도면 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createClient()

    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 사용자 프로필 확인 (관리자 권한 체크)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', authResult.userId)
      .single()

    const role = profile?.role || authResult.role || ''
    const isAdmin = role === 'admin' || role === 'system_admin'

    const supabaseAdminClient = (() => {
      if (isAdmin) {
        try {
          return createServiceClient()
        } catch (error) {
          console.warn('Failed to create service client for markup documents:', error)
        }
      }
      return null
    })()

    const supabaseForDocs = supabaseAdminClient ?? supabase

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const site = searchParams.get('site')
    const worklogId = searchParams.get('worklogId') || searchParams.get('linked_worklog_id')
    const admin = searchParams.get('admin') === 'true'
    const stats = searchParams.get('stats') === 'true'
    // Note: location parameter removed as location column no longer exists
    const offset = (page - 1) * limit

    // 통계 요청 처리
    if (stats) {
      const statsQuery = isAdmin
        ? supabaseForDocs
            .from('markup_documents')
            .select('*', { count: 'exact' })
            .eq('is_deleted', false)
        : supabase
            .from('markup_documents')
            .select('*', { count: 'exact' })
            .eq('is_deleted', false)
            .eq('created_by', authResult.userId)

      const { count: total } = await statsQuery

      return NextResponse.json({
        total: total || 0,
        total_markups: 0, // TODO: Calculate from markup_data
        total_size: 0, // TODO: Calculate actual size
        last_created: new Date().toISOString(),
      })
    }

    // 기본 쿼리 생성 - 관계 정보 포함
    let query = supabaseForDocs
      .from('markup_documents')
      .select(
        `
        *,
        creator:created_by (
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
        )
      `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // 관리자가 아니면 자신이 생성한 문서만 조회 가능
    if (!admin || !isAdmin) {
      query = query.eq('created_by', authResult.userId)
    }

    let linkedDocIdsForFilter: string[] = []
    if (worklogId) {
      const { data: linkedRows } = await supabaseForDocs
        .from('markup_document_worklog_links')
        .select('markup_document_id')
        .eq('worklog_id', worklogId)
      linkedDocIdsForFilter =
        linkedRows
          ?.map(row =>
            typeof row?.markup_document_id === 'string' ? row.markup_document_id : null
          )
          .filter((id): id is string => Boolean(id)) || []
    }

    if (worklogId) {
      if (linkedDocIdsForFilter.length > 0) {
        const inList = linkedDocIdsForFilter.map(id => `"${id}"`).join(',')
        query = query.or(`linked_worklog_id.eq.${worklogId},id.in.(${inList})`)
      } else {
        query = query.eq('linked_worklog_id', worklogId)
      }
    }

    // 검색어 필터
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    // 현장 필터 (site 파라미터가 'all'이 아닌 경우에만 적용)
    if (site && site !== 'all') {
      query = query.eq('site_id', site)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: documents, error, count } = await query

    if (error) {
      console.error('Error fetching markup documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    const documentList = (documents || []) as Array<any>
    const docIds = documentList
      .map(doc => (typeof doc?.id === 'string' ? doc.id : null))
      .filter((id): id is string => Boolean(id))

    const worklogLinkMap = docIds.length > 0 ? await fetchMarkupWorklogMap(docIds) : new Map()

    const worklogIds = new Set<string>()
    documentList.forEach(doc => {
      if (doc?.linked_worklog_id && typeof doc.linked_worklog_id === 'string') {
        worklogIds.add(doc.linked_worklog_id)
      }
      const extras = worklogLinkMap.get(doc?.id) || []
      extras.forEach(id => worklogIds.add(id))
    })
    const uniqueWorklogIds = Array.from(worklogIds)
    const worklogMap = new Map<string, any>()
    if (uniqueWorklogIds.length > 0) {
      const { data: dailyReports, error: worklogError } = await supabaseForDocs
        .from('daily_reports')
        .select('id, work_date, member_name, status')
        .in('id', uniqueWorklogIds)
      if (worklogError) {
        console.warn('Failed to fetch linked worklogs for markup documents:', worklogError)
      } else {
        ;(dailyReports || []).forEach(report => {
          if (report?.id) worklogMap.set(report.id as string, report)
        })
      }
    }

    // 관계 정보를 포함한 문서 포맷팅
    const formattedDocuments = documentList.map(doc => {
      const extras = worklogLinkMap.get(doc?.id) || []
      const combined = doc?.linked_worklog_id
        ? [doc.linked_worklog_id as string, ...extras]
        : extras
      const linkedIds = Array.from(new Set(combined))
      const primaryWorklogId = doc?.linked_worklog_id || linkedIds[0] || null

      return {
        ...doc,
        linked_worklog_ids: linkedIds,
        created_by_name: doc?.creator?.full_name || 'Unknown',
        creator_email: doc?.creator?.email || '',
        creator_role: doc?.creator?.role || '',
        site_name: doc?.site?.name || '',
        site_address: doc?.site?.address || '',
        // 필수 필드 보장 (location field removed from schema)
        file_size: doc?.file_size || 0,
        markup_count: doc?.markup_count || 0,
        daily_report: primaryWorklogId ? worklogMap.get(primaryWorklogId) || null : null,
      }
    })

    const totalPages = Math.ceil((count || 0) / limit)

    // 관리자 모드인 경우 documents 키로도 반환
    if (admin && isAdmin) {
      return NextResponse.json({
        success: true,
        documents: formattedDocuments,
        data: formattedDocuments,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: formattedDocuments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/markup-documents - 새 마킹 도면 저장
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, site_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const isAdmin = authResult.role === 'admin' || authResult.role === 'system_admin'
    const supabaseAdminClient = (() => {
      if (isAdmin) {
        try {
          return createServiceClient()
        } catch (error) {
          console.warn('Failed to create service client for markup document writes:', error)
        }
      }
      return null
    })()
    const supabaseForDocs = supabaseAdminClient ?? supabase

    const body = await request.json()
    const {
      title,
      description,
      original_blueprint_url,
      original_blueprint_filename,
      markup_data,
      preview_image_url,
    } = body
    const preview_image_data =
      (body?.preview_image_data as string | undefined) ||
      (body?.previewImageData as string | undefined)
    const siteIdFromBody = body?.site_id as string | undefined
    const worklogIds: string[] = (() => {
      const raw =
        body?.worklogIds || body?.worklog_ids || body?.linked_worklog_ids || body?.daily_report_ids
      if (Array.isArray(raw)) {
        return raw
          .filter((value: any) => typeof value === 'string')
          .map((value: string) => value.trim())
          .filter(Boolean)
      }
      if (typeof body?.linked_worklog_id === 'string') return [body.linked_worklog_id.trim()]
      if (typeof body?.daily_report_id === 'string') return [body.daily_report_id.trim()]
      return []
    })()
    const primaryWorklogId = worklogIds[0] || null

    // 필수 필드 검증
    if (!title || !original_blueprint_url || !original_blueprint_filename) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: title, original_blueprint_url, original_blueprint_filename',
        },
        { status: 400 }
      )
    }

    // 유효한 site_id 결정 순서: 요청 바디 > 활성 배정 > 프로필 기본값
    let effectiveSiteId: string | null = null
    if (siteIdFromBody) {
      effectiveSiteId = String(siteIdFromBody)
    } else {
      try {
        const { data: activeAssignment } = await supabase
          .from('site_assignments')
          .select('site_id')
          .eq('user_id', authResult.userId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()
        effectiveSiteId = activeAssignment?.site_id ?? (profile as any).site_id ?? null
      } catch {
        effectiveSiteId = (profile as any).site_id ?? null
      }
    }

    let derivedPreviewUrl = preview_image_url
    let derivedPreviewPath: string | null = null
    if (!derivedPreviewUrl && preview_image_data) {
      const uploaded = await uploadDataUrlToDocumentsBucket({
        dataUrl: preview_image_data,
        siteId: effectiveSiteId,
        prefix: 'markup-previews',
        serviceClient: supabaseAdminClient ?? undefined,
      })
      if (uploaded) {
        derivedPreviewUrl = uploaded.url
        derivedPreviewPath = uploaded.path
      }
    }

    // 마킹 개수 계산
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    // markup_documents 테이블에 문서 생성
    const { data: document, error } = await (supabaseForDocs
      .from('markup_documents')
      .insert({
        title,
        description,
        original_blueprint_url,
        original_blueprint_filename,
        markup_data: markup_data || [],
        preview_image_url: derivedPreviewUrl,
        created_by: authResult.userId,
        site_id: effectiveSiteId,
        markup_count,
        file_size: 0, // TODO: 실제 파일 크기 계산
        linked_worklog_id: primaryWorklogId,
      } as unknown)
      .select()
      .single() as unknown)

    if (error) {
      console.error('Error creating markup document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // 동시에 unified_document_system에도 등록하여 통합뷰에 표시되도록 함
    try {
      const { error: unifiedError } = await (supabaseAdminClient ?? supabase)
        .from('unified_document_system')
        .insert({
          title,
          description,
          file_name: `${title}.markup`,
          file_url: `/api/markup-documents/${document.id}/file`, // 마킹 문서 전용 뷰어 URL
          file_size: 0,
          mime_type: 'application/markup-document',
          category_type: 'markup',
          uploaded_by: authResult.userId,
          site_id: (profile as unknown).site_id,
          status: 'uploaded',
          is_public: false, // 마킹 문서는 기본적으로 비공개
          metadata: {
            source_table: 'markup_documents',
            source_id: document.id,
            markup_count,
            original_blueprint_url,
            original_blueprint_filename,
            daily_report_id: primaryWorklogId,
            linked_worklog_ids: worklogIds,
            preview_image_url: derivedPreviewUrl,
            preview_storage_path: derivedPreviewPath,
          },
        })

      if (unifiedError) {
        console.warn('Warning: Failed to sync to unified document system:', unifiedError)
        // 경고만 로그하고 계속 진행 (마킹 문서 생성은 성공했으므로)
      }
    } catch (syncError) {
      console.warn('Warning: Error syncing to unified document system:', syncError)
    }

    try {
      await syncMarkupWorklogLinks(document.id, worklogIds)
    } catch (linkError) {
      console.warn('Failed to sync markup worklog links:', linkError)
    }

    return NextResponse.json({
      success: true,
      data: { ...document, preview_image_url: derivedPreviewUrl, linked_worklog_ids: worklogIds },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
