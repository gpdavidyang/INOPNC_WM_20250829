import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

import * as XLSX from 'xlsx'

interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
  component_name?: string
  work_process?: string
  work_section?: string
  total_workers: number
  npc1000_incoming: number
  npc1000_used: number
  npc1000_remaining: number
  issues: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  created_by: string
  site_id: string
  sites?: {
    name: string
    address: string
    work_process?: string
    work_section?: string
    component_name?: string
    manager_name?: string
    safety_manager_name?: string
  }
  profiles?: {
    full_name: string
    email: string
    phone?: string
    role?: string
    last_login_at?: string
  }
  worker_details_count?: number
  daily_documents_count?: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // Check user permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: '내보내기 권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Get filters from query params
    const filters = {
      site: searchParams.get('site') || '',
      status: searchParams.get('status') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      search: searchParams.get('search') || '',
      component_name: searchParams.get('component_name') || '',
      work_process: searchParams.get('work_process') || '',
      work_section: searchParams.get('work_section') || '',
      // Get all records for export (remove pagination)
      page: 1,
      itemsPerPage: 99999,
      sortField: 'work_date' as const,
      sortDirection: 'desc' as const
    }

    // Get daily reports data
    const result = await getDailyReports(filters)
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'No data' }, { status: 500 })
    }

    const reports = result.data.reports as DailyReport[]

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Prepare main data
    const mainData = reports.map(report => ({
      '작업일자': format(new Date(report.work_date), 'yyyy-MM-dd (EEEE)', { locale: ko }),
      '현장명': report.sites?.name || '-',
      '현장주소': report.sites?.address || '-',
      '담당자': report.member_name,
      '공정': report.process_type,
      '부재명': report.component_name || '-',
      '작업공정': report.work_process || '-',
      '작업구간': report.work_section || '-',
      '작업인원': report.total_workers || 0,
      'NPC-1000 입고': report.npc1000_incoming || 0,
      'NPC-1000 사용': report.npc1000_used || 0,
      'NPC-1000 잔량': report.npc1000_remaining || 0,
      '상태': getStatusText(report.status),
      '특이사항': report.issues || '-',
      '작성자': report.profiles?.full_name || '알 수 없음',
      '작성자역할': getRoleText(report.profiles?.role),
      '작성일': format(new Date(report.created_at), 'yyyy-MM-dd HH:mm'),
      '수정일': format(new Date(report.updated_at), 'yyyy-MM-dd HH:mm'),
      '첨부문서수': report.daily_documents_count || 0,
      '상세인원수': report.worker_details_count || 0
    }))

    // Create main worksheet
    const mainWorksheet = XLSX.utils.json_to_sheet(mainData)
    
    // Set column widths
    const columnWidths = [
      { wch: 18 }, // 작업일자
      { wch: 20 }, // 현장명
      { wch: 25 }, // 현장주소
      { wch: 12 }, // 담당자
      { wch: 12 }, // 공정
      { wch: 15 }, // 부재명
      { wch: 15 }, // 작업공정
      { wch: 15 }, // 작업구간
      { wch: 10 }, // 작업인원
      { wch: 12 }, // NPC-1000 입고
      { wch: 12 }, // NPC-1000 사용
      { wch: 12 }, // NPC-1000 잔량
      { wch: 10 }, // 상태
      { wch: 30 }, // 특이사항
      { wch: 12 }, // 작성자
      { wch: 10 }, // 작성자역할
      { wch: 18 }, // 작성일
      { wch: 18 }, // 수정일
      { wch: 12 }, // 첨부문서수
      { wch: 12 }  // 상세인원수
    ]
    mainWorksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, '작업일지목록')

    // Create summary data
    const totalReports = reports.length
    const submittedReports = reports.filter(r => r.status === 'submitted').length
    const draftReports = reports.filter(r => r.status === 'draft').length
    const totalWorkers = reports.reduce((sum, r) => sum + (r.total_workers || 0), 0)
    const totalNPC1000Used = reports.reduce((sum, r) => sum + (r.npc1000_used || 0), 0)
    const totalNPC1000Incoming = reports.reduce((sum, r) => sum + (r.npc1000_incoming || 0), 0)
    const activeSites = new Set(reports.map(r => r.site_id)).size

    const summaryData = [
      { '항목': '총 작업일지 수', '값': totalReports, '단위': '개' },
      { '항목': '제출된 일지', '값': submittedReports, '단위': '개' },
      { '항목': '임시저장 일지', '값': draftReports, '단위': '개' },
      { '항목': '제출률', '값': totalReports > 0 ? Math.round((submittedReports / totalReports) * 100) : 0, '단위': '%' },
      { '항목': '총 작업인원', '값': totalWorkers, '단위': '명' },
      { '항목': '평균 작업인원', '값': totalReports > 0 ? Math.round(totalWorkers / totalReports) : 0, '단위': '명' },
      { '항목': 'NPC-1000 총 입고량', '값': (totalNPC1000Incoming / 1000).toFixed(1), '단위': 't' },
      { '항목': 'NPC-1000 총 사용량', '값': (totalNPC1000Used / 1000).toFixed(1), '단위': 't' },
      { '항목': '활성 현장 수', '값': activeSites, '단위': '개' }
    ]

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    summaryWorksheet['!cols'] = [
      { wch: 20 }, // 항목
      { wch: 15 }, // 값
      { wch: 10 }  // 단위
    ]
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '요약통계')

    // Create site-wise summary
    const siteStats = new Map()
    reports.forEach(report => {
      const siteId = report.site_id
      if (!siteStats.has(siteId)) {
        siteStats.set(siteId, {
          siteName: report.sites?.name || '알 수 없음',
          reportCount: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          submittedCount: 0
        })
      }

      const stats = siteStats.get(siteId)
      stats.reportCount++
      stats.totalWorkers += report.total_workers || 0
      stats.totalNPC1000Used += report.npc1000_used || 0
      if (report.status === 'submitted') {
        stats.submittedCount++
      }
    })

    const siteData = Array.from(siteStats.values()).map(stats => ({
      '현장명': stats.siteName,
      '작업일지 수': stats.reportCount,
      '총 작업인원': stats.totalWorkers,
      'NPC-1000 사용량(t)': (stats.totalNPC1000Used / 1000).toFixed(1),
      '제출률(%)': stats.reportCount > 0 ? Math.round((stats.submittedCount / stats.reportCount) * 100) : 0
    }))

    const siteWorksheet = XLSX.utils.json_to_sheet(siteData)
    siteWorksheet['!cols'] = [
      { wch: 25 }, // 현장명
      { wch: 12 }, // 작업일지 수
      { wch: 12 }, // 총 작업인원
      { wch: 15 }, // NPC-1000 사용량
      { wch: 10 }  // 제출률
    ]
    XLSX.utils.book_append_sheet(workbook, siteWorksheet, '현장별요약')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename
    const fileName = `작업일지_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`

    // Log export activity (simplified version to avoid authentication issues)
    try {
      await (supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'export_data',
          entity_type: 'daily_reports',
          entity_id: 'excel_export',
          details: {
            format: 'excel',
            record_count: totalReports,
            filters: filters
          }
        } as unknown) as unknown)
    } catch (logError) {
      // Don't fail the export if logging fails
      console.warn('Failed to log export activity:', logError)
    }

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': excelBuffer.length.toString(),
      }
    })

  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json(
      { error: '엑셀 파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'draft': return '임시저장'
    case 'submitted': return '제출됨'
    case 'approved': return '승인됨'
    case 'rejected': return '반려됨'
    default: return '-'
  }
}

function getRoleText(role?: string): string {
  switch (role) {
    case 'admin': return '관리자'
    case 'system_admin': return '시스템관리자'
    case 'site_manager': return '현장담당'
    case 'worker': return '작업자'
    case 'partner': return '협력사'
    default: return role || '-'
  }
}