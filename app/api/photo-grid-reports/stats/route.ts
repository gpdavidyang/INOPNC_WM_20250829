import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AsyncState, ApiResponse } from '@/types/utils'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


// GET /api/photo-grid-reports/stats - PDF 보고서 통계 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: '통계 조회 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    // 기본 통계 쿼리
    let statusFilter = includeDeleted ? ['active', 'archived', 'deleted'] : ['active', 'archived']
    
    const { data: reports, error } = await supabase
      .from('photo_grid_reports')
      .select(`
        id,
        status,
        generation_method,
        file_size,
        download_count,
        total_photo_groups,
        total_before_photos,
        total_after_photos,
        created_at,
        daily_report:daily_reports(
          site:sites(name)
        ),
        generated_by_profile:profiles!generated_by(
          full_name
        )
      `)
      .in('status', statusFilter)

    if (error) {
      console.error('통계 조회 오류:', error)
      return NextResponse.json(
        { error: '통계 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 통계 계산
    const stats = {
      total_reports: reports.length,
      total_file_size: reports.reduce((sum: number, r: unknown) => sum + (r.file_size || 0), 0),
      total_downloads: reports.reduce((sum: number, r: unknown) => sum + (r.download_count || 0), 0),
      total_photo_groups: reports.reduce((sum: number, r: unknown) => sum + (r.total_photo_groups || 0), 0),
      total_before_photos: reports.reduce((sum: number, r: unknown) => sum + (r.total_before_photos || 0), 0),
      total_after_photos: reports.reduce((sum: number, r: unknown) => sum + (r.total_after_photos || 0), 0),
      
      // 상태별 통계
      reports_by_status: reports.reduce((acc: unknown, r: unknown) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // 생성 방법별 통계
      reports_by_method: reports.reduce((acc: unknown, r: unknown) => {
        const method = r.generation_method || 'unknown'
        acc[method] = (acc[method] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // 평균 파일 크기
      average_file_size: reports.length > 0 
        ? Math.round(reports.reduce((sum: number, r: unknown) => sum + (r.file_size || 0), 0) / reports.length)
        : 0,
      
      // 가장 많이 다운로드된 보고서
      most_downloaded: reports.length > 0
        ? reports.reduce((max: unknown, r: unknown) => 
            (r.download_count || 0) > (max.download_count || 0) ? r : max
          )
        : null,
      
      // 최근 보고서 (최신 5개)
      recent_reports: reports
        .sort((a: unknown, b: unknown) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
      
      // 사이트별 통계
      reports_by_site: reports.reduce((acc: unknown, r: unknown) => {
        const siteName = r.daily_report?.site?.name || '알 수 없음'
        acc[siteName] = (acc[siteName] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // 생성자별 통계
      reports_by_creator: reports.reduce((acc: unknown, r: unknown) => {
        const creatorName = r.generated_by_profile?.full_name || '알 수 없음'
        acc[creatorName] = (acc[creatorName] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // 월별 생성 통계 (최근 12개월)
      reports_by_month: reports.reduce((acc: unknown, r: unknown) => {
        const month = new Date(r.created_at).toISOString().substring(0, 7) // YYYY-MM
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}