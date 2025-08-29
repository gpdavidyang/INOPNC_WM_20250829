import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MarkupDocument } from '@/types'

// GET /api/markup-documents - 마킹 도면 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 사용자 프로필 확인 (관리자 권한 체크)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin'
    
    // 쿼리 파라미터
    const location = searchParams.get('location') || 'personal'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const site = searchParams.get('site')
    const admin = searchParams.get('admin') === 'true'
    const stats = searchParams.get('stats') === 'true'
    const offset = (page - 1) * limit
    
    // 통계 요청 처리
    if (stats) {
      const statsQuery = isAdmin 
        ? supabase.from('markup_documents').select('*', { count: 'exact' }).eq('is_deleted', false)
        : supabase.from('markup_documents').select('*', { count: 'exact' }).eq('is_deleted', false).eq('created_by', user.id)
      
      const { count: total } = await statsQuery
      const { count: personal } = await (isAdmin 
        ? supabase.from('markup_documents').select('*', { count: 'exact' }).eq('is_deleted', false).eq('location', 'personal')
        : supabase.from('markup_documents').select('*', { count: 'exact' }).eq('is_deleted', false).eq('created_by', user.id).eq('location', 'personal'))
      
      const { count: shared } = await (isAdmin 
        ? supabase.from('markup_documents').select('*', { count: 'exact' }).eq('is_deleted', false).eq('location', 'shared')
        : supabase.from('markup_documents').select('*', { count: 'exact' }).eq('is_deleted', false).eq('location', 'shared'))

      return NextResponse.json({
        total: total || 0,
        personal: personal || 0,
        shared: shared || 0,
        total_markups: 0, // TODO: Calculate from markup_data
        total_size: 0, // TODO: Calculate actual size
        last_created: new Date().toISOString()
      })
    }
    
    // 기본 쿼리 생성 - 관계 정보 포함
    let query = supabase
      .from('markup_documents')
      .select(`
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
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    
    // 관리자 모드가 아니면 사용자 권한에 따라 필터링
    if (!admin || !isAdmin) {
      // location 필터
      if (location === 'personal') {
        query = query.eq('created_by', user.id).eq('location', 'personal')
      } else if (location === 'shared') {
        query = query.eq('location', 'shared')
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
    
    // 관계 정보를 포함한 문서 포맷팅
    const formattedDocuments = documents?.map((doc: any) => ({
      ...doc,
      created_by_name: doc.creator?.full_name || 'Unknown',
      creator_email: doc.creator?.email || '',
      creator_role: doc.creator?.role || '',
      site_name: doc.site?.name || '',
      site_address: doc.site?.address || ''
    })) || []
    
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
          totalPages
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: formattedDocuments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/markup-documents - 새 마킹 도면 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, site_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      original_blueprint_url,
      original_blueprint_filename,
      markup_data,
      location = 'personal',
      preview_image_url
    } = body

    // 필수 필드 검증
    if (!title || !original_blueprint_url || !original_blueprint_filename) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, original_blueprint_url, original_blueprint_filename' 
      }, { status: 400 })
    }

    // 마킹 개수 계산
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    // 문서 생성
    const { data: document, error } = await supabase
      .from('markup_documents' as any)
      .insert({
        title,
        description,
        original_blueprint_url,
        original_blueprint_filename,
        markup_data: markup_data || [],
        location,
        preview_image_url,
        created_by: user.id,
        site_id: (profile as any).site_id,
        markup_count,
        file_size: 0 // TODO: 실제 파일 크기 계산
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating markup document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
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