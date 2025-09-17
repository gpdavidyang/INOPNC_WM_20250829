import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'draft' | 'completed' | null
    const search = searchParams.get('search')
    const year = searchParams.get('year') || new Date().getFullYear()
    const month = searchParams.get('month') || new Date().getMonth() + 1

    // 작업일지 조회 쿼리 구성
    let query = supabase
      .from('daily_reports')
      .select(
        `
        id,
        work_date,
        site_id,
        sites!inner(name),
        work_content,
        location_info,
        additional_notes,
        created_by,
        created_at,
        updated_at,
        is_completed,
        worker_assignments!inner(
          profile_id,
          labor_hours,
          profiles!inner(full_name)
        ),
        material_usage(
          material_type,
          inbound_quantity,
          used_quantity,
          stock_quantity
        ),
        report_photos(
          id,
          file_url,
          caption
        ),
        report_documents(
          id,
          document_type,
          file_url,
          file_name
        )
      `
      )
      .eq('created_by', user.id)
      .gte('work_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('work_date', `${year}-${String(month).padStart(2, '0')}-31`)
      .order('work_date', { ascending: false })

    // 상태 필터링
    if (status === 'draft') {
      query = query.eq('is_completed', false)
    } else if (status === 'completed') {
      query = query.eq('is_completed', true)
    }

    // 검색어 필터링
    if (search) {
      query = query.ilike('sites.name', `%${search}%`)
    }

    const { data: reports, error: queryError } = await query

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // 데이터 변환
    const transformedReports = (reports || []).map(report => {
      const locationInfo = report.location_info || {}
      const workerInfo = report.worker_assignments?.[0]
      const materialInfo = report.material_usage?.find(m => m.material_type === 'NPC-1000') || {}

      return {
        id: report.id,
        siteName: report.sites?.name || '',
        workDate: report.work_date,
        author: workerInfo?.profiles?.full_name || '작성자 미상',
        buildingName: locationInfo.building || '',
        block: locationInfo.block || '',
        dong: locationInfo.dong || '',
        ho: locationInfo.unit || '',
        workProcess: report.work_content?.split(',')[0] || '',
        workType: locationInfo.work_type?.join(', ') || '',
        manHours: workerInfo?.labor_hours || 0,
        status: report.is_completed ? 'completed' : 'draft',
        npcData: {
          inbound: materialInfo.inbound_quantity || 0,
          used: materialInfo.used_quantity || 0,
          stock: materialInfo.stock_quantity || 0,
        },
        photos: (report.report_photos || []).map(p => p.file_url),
        drawings: (report.report_documents || [])
          .filter(d => d.document_type === 'drawing')
          .map(d => d.file_url),
        completionDocs: (report.report_documents || [])
          .filter(d => d.document_type === 'completion')
          .map(d => d.file_url),
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      }
    })

    // 임시저장 건수 계산
    const draftCount = transformedReports.filter(r => r.status === 'draft').length

    return NextResponse.json({
      reports: transformedReports,
      draftCount,
      year,
      month,
    })
  } catch (error) {
    console.error('Work reports API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
