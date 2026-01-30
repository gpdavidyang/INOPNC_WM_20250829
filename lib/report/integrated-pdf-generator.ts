import { ReportSelectionData } from '@/modules/mobile/components/work-log/ReportSelectionModal'
import { WorkLog } from '@/modules/mobile/types/work-log.types'
import jsPDF from 'jspdf'

interface GenerateOptions {
  workLog: WorkLog
  selection: ReportSelectionData
  photos?: any[]
  drawings?: any[]
}

export const generateIntegratedReport = async ({
  workLog,
  selection,
  photos = [],
  drawings = [],
}: GenerateOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Set font (Assuming Korean font is needed, using basic fallback for now or need to load font)
  // In a real app, you MUST add a Korean font (e.g. Malgun Gothic) via doc.addFileToVFS and doc.addFont
  // doc.setFont('MalgunGothic', 'normal')
  doc.setFontSize(10)

  let currentPage = 1

  // === 1. Cover Page ===
  doc.setFontSize(24)
  doc.text('공 사 작 업 보 고 서', 105, 100, { align: 'center' })

  doc.setFontSize(16)
  doc.text(`현장명: ${workLog.siteName}`, 105, 120, { align: 'center' })
  doc.text(`일자: ${new Date(workLog.date).toLocaleDateString()}`, 105, 130, { align: 'center' })
  doc.text(`작성자: ${workLog.author}`, 105, 140, { align: 'center' })

  // Signatures
  doc.rect(130, 250, 60, 30) // Box
  doc.setFontSize(12)
  doc.text('관리자 확인', 160, 245, { align: 'center' })
  doc.text('(인)', 180, 270)

  // === 2. Work Log Detail Page ===
  if (selection.includeWorkLog) {
    doc.addPage()
    currentPage++

    doc.setFontSize(18)
    doc.text('1. 작업일지 상세', 20, 20)

    // Draw basic table
    let y = 30
    const col1 = 30
    const col2 = 80

    doc.setFontSize(11)

    // Info Rows
    doc.text('작업일자:', 20, y)
    doc.text(new Date(workLog.date).toLocaleDateString(), col2, y)
    y += 10
    doc.text('날씨:', 20, y)
    doc.text(workLog.companyName || '-', col2, y)
    y += 10 // Temp field
    doc.text('작업공종:', 20, y)
    doc.text(workLog.workTypes.join(', '), col2, y)
    y += 10
    doc.text('작업내용:', 20, y)

    // Multi-line description
    const splitDesc = doc.splitTextToSize(workLog.notes || '', 150)
    doc.text(splitDesc, col2, y)
    y += splitDesc.length * 5 + 5

    // Materials
    if (workLog.materials && workLog.materials.length > 0) {
      y += 10
      doc.text('사용자재:', 20, y)
      workLog.materials.forEach(mat => {
        doc.text(`- ${mat.material_name}: ${mat.quantity} ${mat.unit || ''}`, col2, y)
        y += 6
      })
    }
  }

  // === 3. Photo Sheets ===
  // Note: True implementation needs to render the PhotoGrid component to canvas or manual positioning
  if (selection.selectedPhotoSheets.length > 0) {
    doc.addPage()
    currentPage++
    doc.setFontSize(18)
    doc.text('2. 사진 대지', 20, 20)
    doc.setFontSize(11)
    doc.text(`첨부된 사진대지: ${selection.selectedPhotoSheets.length}건`, 20, 30)

    // Placeholder for where photos would go
    // In real implementation: loop through photos array and drawImage
    let y = 40
    photos.forEach((photo, idx) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.rect(20, y, 80, 60) // Photo placeholder
      doc.text(`사진 ${idx + 1}`, 25, y + 5)
      // doc.addImage(photo.url, 'JPEG', 20, y, 80, 60)
      y += 70
    })
  }

  // === 4. Marked Drawings (SVG/Image) ===
  if (selection.selectedDrawings.length > 0) {
    doc.addPage()
    currentPage++
    doc.setFontSize(18)
    doc.text('3. 도면 마킹', 20, 20)

    // Placeholder
    doc.rect(20, 30, 170, 120)
    doc.text('도면 이미지가 여기에 삽입됩니다.', 105, 90, { align: 'center' })
    // In real implementation:
    // await doc.addImage(drawingImage, 'PNG', 20, 30, 170, 120)
  }

  return doc
}
