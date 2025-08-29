import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PhotoGridReport } from '@/types'

// GET /api/photo-grid-reports - PDF 보고서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 쿼리 매개변수 파싱
    const dailyReportId = searchParams.get('dailyReportId')
    const status = searchParams.get('status') || 'active'
    const generatedBy = searchParams.get('generatedBy')
    const siteId = searchParams.get('siteId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 기본 쿼리 구성
    let query = supabase
      .from('photo_grid_reports')
      .select(`
        *,
        daily_report:daily_reports(
          id,
          work_date,
          member_name,
          process_type,
          site:sites(
            id,
            name
          )
        ),
        generated_by_profile:profiles!generated_by(
          id,
          full_name,
          email
        ),
        last_downloaded_by_profile:profiles!last_downloaded_by(
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 필터 적용
    if (dailyReportId) {
      query = query.eq('daily_report_id', dailyReportId)
    }
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (generatedBy) {
      query = query.eq('generated_by', generatedBy)
    }
    
    if (siteId) {
      query = query.eq('daily_report.site_id', siteId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('PDF 보고서 조회 오류:', error)
      return NextResponse.json(
        { error: 'PDF 보고서 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      offset,
      limit
    })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/photo-grid-reports - 새 PDF 보고서 생성 (파일 업로드 포함)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dailyReportId = formData.get('dailyReportId') as string
    const title = formData.get('title') as string || '사진대지양식'
    const metadataStr = formData.get('metadata') as string

    if (!file || !dailyReportId) {
      return NextResponse.json(
        { error: '파일과 작업일지 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    let metadata = {}
    try {
      metadata = metadataStr ? JSON.parse(metadataStr) : {}
    } catch (error) {
      console.warn('메타데이터 파싱 실패:', error)
    }

    // 1. Supabase Storage에 파일 업로드
    const fileName = `photo-grid-${dailyReportId}-${Date.now()}.pdf`
    const filePath = `photo-grid-reports/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      })
    
    if (uploadError) {
      console.error('파일 업로드 오류:', uploadError)
      return NextResponse.json(
        { error: 'PDF 파일 업로드에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    // 2. 업로드된 파일의 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)
    
    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'PDF 파일 URL 생성에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    // 3. 데이터베이스에 레코드 생성
    const { data: reportData, error: dbError } = await supabase
      .from('photo_grid_reports')
      .insert({
        daily_report_id: dailyReportId,
        title,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: 'application/pdf',
        generated_by: user.id,
        ...metadata
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('데이터베이스 오류:', dbError)
      // 실패 시 업로드된 파일 정리
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json(
        { error: 'PDF 정보 저장에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: reportData }, { status: 201 })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}