'use client'

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { DailyReport, Site } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export class PDFExporter {
  static async exportDailyReports(
    reports: DailyReport[], 
    sites: Site[], 
    options: {
      includePhotos?: boolean
      includeDrawings?: boolean
      fileName?: string
      title?: string
    } = {}
  ): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Set font (fallback to default)
      doc.setFont('helvetica')

      // Add title
      const title = options.title || 'Daily Work Reports'
      doc.setFontSize(18)
      doc.text(title, 148, 20, { align: 'center' })

      // Add generation date
      doc.setFontSize(10)
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 148, 30, { align: 'center' })

      // Prepare table data
      const tableData = reports.map(report => {
        const site = sites.find(s => s.id === report.site_id)
        
        return [
          format(new Date(report.work_date), 'yyyy-MM-dd'),
          site?.name || '-',
          report.member_name,
          report.process_type,
          report.total_workers?.toString() || '0',
          report.npc1000_used?.toString() || '0',
          this.getStatusText(report.status || undefined),
          report.issues ? (report.issues.length > 30 ? report.issues.substring(0, 30) + '...' : report.issues) : '-'
        ]
      })

      // Add main table
      doc.autoTable({
        head: [['Work Date', 'Site', 'Manager', 'Process', 'Workers', 'NPC-1000', 'Status', 'Issues']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Work Date
          1: { cellWidth: 40 }, // Site
          2: { cellWidth: 30 }, // Manager
          3: { cellWidth: 25 }, // Process
          4: { cellWidth: 20 }, // Workers
          5: { cellWidth: 25 }, // NPC-1000
          6: { cellWidth: 20 }, // Status
          7: { cellWidth: 60 }  // Issues
        }
      })

      // Add summary page
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Summary Report', 148, 20, { align: 'center' })

      const summaryData = this.createSummaryData(reports, sites)
      
      doc.autoTable({
        head: [['Item', 'Value', 'Unit']],
        body: summaryData.map(item => [item.item, item.value.toString(), item.unit]),
        startY: 40,
        styles: {
          fontSize: 11,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 }
        }
      })

      // Generate filename
      const fileName = options.fileName || 
        `daily-reports_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`

      // Save file
      doc.save(fileName)

      return { 
        success: true, 
        fileName 
      }
    } catch (error) {
      console.error('PDF export error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'PDF export failed' 
      }
    }
  }

  private static getStatusText(status?: string): string {
    switch (status) {
      case 'draft': return 'Draft'
      case 'submitted': return 'Submitted'
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      default: return '-'
    }
  }

  private static createSummaryData(reports: DailyReport[], sites: Site[]) {
    const totalReports = reports.length
    const approvedReports = reports.filter(r => r.status === 'approved').length
    const rejectedReports = reports.filter(r => r.status === 'rejected').length
    const totalWorkers = reports.reduce((sum: any, r: any) => sum + (r.total_workers || 0), 0)
    const totalNPC1000Used = reports.reduce((sum: any, r: any) => sum + (r.npc1000_used || 0), 0)
    const approvalRate = totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0

    return [
      { item: 'Total Reports', value: totalReports, unit: 'pcs' },
      { item: 'Approved Reports', value: approvedReports, unit: 'pcs' },
      { item: 'Rejected Reports', value: rejectedReports, unit: 'pcs' },
      { item: 'Approval Rate', value: approvalRate, unit: '%' },
      { item: 'Total Workers', value: totalWorkers, unit: 'persons' },
      { item: 'Average Workers', value: totalReports > 0 ? Math.round(totalWorkers / totalReports) : 0, unit: 'persons' },
      { item: 'Total NPC-1000 Used', value: (totalNPC1000Used / 1000).toFixed(1), unit: 't' },
      { item: 'Active Sites', value: new Set(reports.map(r => r.site_id)).size, unit: 'sites' }
    ]
  }
}