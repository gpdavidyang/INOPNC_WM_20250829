import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Ensure authenticated (return 401/403 instead of 500 on auth errors)
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('site_id')
    const userId = searchParams.get('user_id')
    const includeShared = searchParams.get('include_shared') === 'true'

    const supabase = createClient()

    // 기본 쿼리 빌더 (관계 조인 제거 - 프로덕션 FK 환경 차이로 인한 오류 방지)
    let query = supabase
      .from('markup_documents')
      .select(
        `id, title, original_blueprint_url, markup_data, site_id, created_by, created_at, updated_at, markup_count, preview_image_url, original_blueprint_filename`
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // 사이트 필터링
    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // 사용자 필터링 (본인 것만 또는 공유된 것 포함)
    if (userId && !includeShared) {
      query = query.eq('created_by', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching markup documents:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    // 데이터 포맷팅
    let formattedDocuments = (data || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      blueprintUrl: doc.original_blueprint_url,
      markupData: doc.markup_data,
      siteId: doc.site_id,
      siteName: '알 수 없는 현장',
      createdBy: doc.created_by,
      createdByName: undefined,
      creatorEmail: undefined,
      mode: undefined,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isMarked: doc.markup_data && doc.markup_data.length > 0,
      markupCount:
        typeof doc.markup_count === 'number'
          ? doc.markup_count
          : doc.markup_data
            ? doc.markup_data.length
            : 0,
    }))

    // include_shared=true + siteId가 지정되면, 본인 소유이며 site_id가 비어있는 개인 문서도 추가 노출
    if (includeShared && siteId) {
      try {
        const { data: ownPersonal } = await supabase
          .from('markup_documents')
          .select(
            'id, title, original_blueprint_url, markup_data, site_id, created_by, created_at, updated_at, markup_count, preview_image_url, original_blueprint_filename'
          )
          .is('site_id', null)
          .eq('created_by', auth.userId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })

        if (ownPersonal && ownPersonal.length) {
          const extras = ownPersonal.map(doc => ({
            id: doc.id,
            title: doc.title,
            blueprintUrl: doc.original_blueprint_url,
            markupData: doc.markup_data,
            siteId: doc.site_id,
            siteName: '미지정',
            createdBy: doc.created_by,
            createdByName: undefined,
            creatorEmail: undefined,
            mode: undefined,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at,
            isMarked: doc.markup_data && doc.markup_data.length > 0,
            markupCount:
              typeof doc.markup_count === 'number'
                ? doc.markup_count
                : doc.markup_data
                  ? doc.markup_data.length
                  : 0,
          }))
          const existingIds = new Set(formattedDocuments.map(d => d.id))
          formattedDocuments = formattedDocuments.concat(extras.filter(e => !existingIds.has(e.id)))
        }
      } catch (_) {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: formattedDocuments,
        total: formattedDocuments.length,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
