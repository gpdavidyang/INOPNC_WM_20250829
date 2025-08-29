'use client'

import { DailyReport, Site } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export class CSVExporter {
  static exportDailyReports(
    reports: DailyReport[], 
    sites: Site[], 
    options: {
      fileName?: string
      includeBOM?: boolean
    } = {}
  ): Promise<{ success: boolean; fileName?: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        // Prepare headers (Korean)
        const headers = [
          '작업일자',
          '현장명',
          '담당자',
          '공정',
          '작업인원',
          'NPC-1000 입고량',
          'NPC-1000 사용량',
          'NPC-1000 잔량',
          '상태',
          '특이사항',
          '작성일시',
          '제출일시',
          '승인일시'
        ]

        // Prepare data rows
        const rows = reports.map(report => {
          const site = sites.find(s => s.id === report.site_id)
          
          return [
            format(new Date(report.work_date), 'yyyy-MM-dd (EEEE)', { locale: ko }),
            site?.name || '-',
            report.member_name,
            report.process_type,
            report.total_workers?.toString() || '0',
            report.npc1000_incoming?.toString() || '0',
            report.npc1000_used?.toString() || '0',
            report.npc1000_remaining?.toString() || '0',
            this.getStatusText(report.status || undefined),
            this.escapeCsvField(report.issues || '-'),
            format(new Date(report.created_at), 'yyyy-MM-dd HH:mm'),
            (report as any).submitted_at ? format(new Date((report as any).submitted_at), 'yyyy-MM-dd HH:mm') : '-',
            (report as any).approved_at ? format(new Date((report as any).approved_at), 'yyyy-MM-dd HH:mm') : '-'
          ]
        })

        // Create CSV content
        let csvContent = ''
        
        // Add BOM for proper Korean encoding in Excel
        if (options.includeBOM !== false) {
          csvContent = '\uFEFF'
        }

        // Add headers
        csvContent += headers.join(',') + '\n'

        // Add data rows
        rows.forEach(row => {
          csvContent += row.map(field => this.escapeCsvField(field)).join(',') + '\n'
        })

        // Generate filename
        const fileName = options.fileName || 
          `일일보고서_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        
        if ((navigator as any).msSaveBlob) {
          // IE 10+
          (navigator as any).msSaveBlob(blob, fileName)
        } else {
          const link = document.createElement('a')
          if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', fileName)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
        }

        resolve({ 
          success: true, 
          fileName 
        })
      } catch (error) {
        console.error('CSV export error:', error)
        resolve({ 
          success: false, 
          error: error instanceof Error ? error.message : 'CSV 내보내기에 실패했습니다.' 
        })
      }
    })
  }

  private static escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private static getStatusText(status?: string): string {
    switch (status) {
      case 'draft': return '임시저장'
      case 'submitted': return '제출됨'
      case 'approved': return '승인됨'
      case 'rejected': return '반려됨'
      default: return '-'
    }
  }
}