'use client'

import * as XLSX from 'xlsx'

export class ExcelExporter {
  static exportDailyReports(
    reports: DailyReport[],
    sites: Site[],
    options: {
      includePhotos?: boolean
      includeDrawings?: boolean
      fileName?: string
    } = {}
  ): Promise<{ success: boolean; fileName?: string; error?: string }> {
    return new Promise(resolve => {
      try {
        // Create workbook
        const workbook = XLSX.utils.book_new()

        // Prepare main data
        const mainData = reports.map(report => {
          const site = sites.find(s => s.id === report.site_id)

          return {
            작업일자: format(new Date(report.work_date), 'yyyy-MM-dd (EEEE)', { locale: ko }),
            현장명: site?.name || '-',
            담당자: report.member_name,
            공정: report.process_type,
            작업인원: report.total_workers || 0,
            'NPC-1000 입고': report.npc1000_incoming || 0,
            'NPC-1000 사용': report.npc1000_used || 0,
            'NPC-1000 잔량': report.npc1000_remaining || 0,
            상태: this.getStatusText(report.status || undefined),
            특이사항: report.issues || '-',
            작성일: format(new Date(report.created_at), 'yyyy-MM-dd HH:mm'),
            제출일: (report as unknown).submitted_at
              ? format(new Date((report as unknown).submitted_at), 'yyyy-MM-dd HH:mm')
              : '-',
            승인일: (report as unknown).approved_at
              ? format(new Date((report as unknown).approved_at), 'yyyy-MM-dd HH:mm')
              : '-',
          }
        })

        // Create main worksheet
        const mainWorksheet = XLSX.utils.json_to_sheet(mainData)

        // Set column widths
        const columnWidths = [
          { wch: 18 }, // 작업일자
          { wch: 20 }, // 현장명
          { wch: 12 }, // 담당자
          { wch: 12 }, // 공정
          { wch: 10 }, // 작업인원
          { wch: 12 }, // NPC-1000 입고
          { wch: 12 }, // NPC-1000 사용
          { wch: 12 }, // NPC-1000 잔량
          { wch: 10 }, // 상태
          { wch: 30 }, // 특이사항
          { wch: 18 }, // 작성일
          { wch: 18 }, // 제출일
          { wch: 18 }, // 승인일
        ]
        mainWorksheet['!cols'] = columnWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, mainWorksheet, '일일보고서')

        // Create summary worksheet
        const summaryData = this.createSummaryData(reports, sites)
        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
        summaryWorksheet['!cols'] = [
          { wch: 20 }, // 항목
          { wch: 15 }, // 값
          { wch: 10 }, // 단위
        ]
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '요약')

        // Create site-wise summary
        const siteData = this.createSiteWiseData(reports, sites)
        const siteWorksheet = XLSX.utils.json_to_sheet(siteData)
        siteWorksheet['!cols'] = [
          { wch: 25 }, // 현장명
          { wch: 10 }, // 보고서 수
          { wch: 12 }, // 총 작업인원
          { wch: 15 }, // NPC-1000 사용량
          { wch: 10 }, // 승인률
        ]
        XLSX.utils.book_append_sheet(workbook, siteWorksheet, '현장별 요약')

        // Generate filename
        const fileName =
          options.fileName || `일일보고서_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`

        // Write file
        XLSX.writeFile(workbook, fileName)

        resolve({
          success: true,
          fileName,
        })
      } catch (error) {
        console.error('Excel export error:', error)
        resolve({
          success: false,
          error: error instanceof Error ? error.message : '엑셀 내보내기에 실패했습니다.',
        })
      }
    })
  }

  private static getStatusText(status?: string): string {
    switch (status) {
      case 'draft':
        return '임시'
      case 'submitted':
        return '제출됨'
      case 'approved':
        return '승인됨'
      case 'rejected':
        return '반려됨'
      default:
        return '-'
    }
  }

  private static createSummaryData(reports: DailyReport[], sites: Site[]) {
    const totalReports = reports.length
    const approvedReports = reports.filter(r => r.status === 'approved').length
    const rejectedReports = reports.filter(r => r.status === 'rejected').length
    const totalWorkers = reports.reduce(
      (sum: unknown, r: unknown) => sum + (r.total_workers || 0),
      0
    )
    const totalNPC1000Used = reports.reduce(
      (sum: unknown, r: unknown) => sum + (r.npc1000_used || 0),
      0
    )
    const totalNPC1000Incoming = reports.reduce(
      (sum: unknown, r: unknown) => sum + (r.npc1000_incoming || 0),
      0
    )
    const approvalRate = totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0

    return [
      { 항목: '총 보고서 수', 값: totalReports, 단위: '개' },
      { 항목: '승인된 보고서', 값: approvedReports, 단위: '개' },
      { 항목: '반려된 보고서', 값: rejectedReports, 단위: '개' },
      { 항목: '승인률', 값: approvalRate, 단위: '%' },
      { 항목: '총 작업인원', 값: totalWorkers, 단위: '명' },
      {
        항목: '평균 작업인원',
        값: totalReports > 0 ? Math.round(totalWorkers / totalReports) : 0,
        단위: '명',
      },
      { 항목: 'NPC-1000 총 입고량', 값: (totalNPC1000Incoming / 1000).toFixed(1), 단위: 't' },
      { 항목: 'NPC-1000 총 사용량', 값: (totalNPC1000Used / 1000).toFixed(1), 단위: 't' },
      { 항목: '활성 현장 수', 값: new Set(reports.map(r => r.site_id)).size, 단위: '개' },
    ]
  }

  private static createSiteWiseData(reports: DailyReport[], sites: Site[]) {
    const siteStats = new Map()

    reports.forEach(report => {
      const siteId = report.site_id
      if (!siteStats.has(siteId)) {
        siteStats.set(siteId, {
          reportCount: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          approvedCount: 0,
        })
      }

      const stats = siteStats.get(siteId)
      stats.reportCount++
      stats.totalWorkers += report.total_workers || 0
      stats.totalNPC1000Used += report.npc1000_used || 0
      if (report.status === 'approved') {
        stats.approvedCount++
      }
    })

    return Array.from(siteStats.entries()).map(([siteId, stats]) => {
      const site = sites.find(s => s.id === siteId)
      const approvalRate =
        stats.reportCount > 0 ? Math.round((stats.approvedCount / stats.reportCount) * 100) : 0

      return {
        현장명: site?.name || '알 수 없음',
        '보고서 수': stats.reportCount,
        '총 작업인원': stats.totalWorkers,
        'NPC-1000 사용량(t)': (stats.totalNPC1000Used / 1000).toFixed(1),
        '승인률(%)': approvalRate,
      }
    })
  }
}
