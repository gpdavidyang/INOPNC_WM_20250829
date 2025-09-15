import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('site_id')
    const userId = searchParams.get('user_id')
    const includeShared = searchParams.get('include_shared') === 'true'

    const supabase = createClient()

    // 기본 쿼리 빌더
    let query = supabase
      .from('markup_documents')
      .select(
        `
        id,
        title,
        original_blueprint_url,
        markup_data,
        site_id,
        created_by,
        created_by_name,
        creator_email,
        mode,
        created_at,
        updated_at,
        sites (
          id,
          name
        ),
        profiles!markup_documents_created_by_fkey (
          id,
          full_name,
          email
        )
      `
      )
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
    const formattedDocuments = (data || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      blueprintUrl: doc.original_blueprint_url,
      markupData: doc.markup_data,
      siteId: doc.site_id,
      siteName: doc.sites?.name || '알 수 없는 현장',
      createdBy: doc.created_by,
      createdByName: doc.created_by_name || doc.profiles?.full_name || '알 수 없음',
      creatorEmail: doc.creator_email || doc.profiles?.email,
      mode: doc.mode,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isMarked: doc.markup_data && doc.markup_data.length > 0,
      markupCount: doc.markup_data ? doc.markup_data.length : 0,
    }))

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
