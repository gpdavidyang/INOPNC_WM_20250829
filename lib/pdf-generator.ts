
export interface PDFGeneratorOptions {
  title: string
  siteName: string
  reportDate: string
  reporterName: string
  photoGroups: unknown[]
}

// HTML을 Canvas로 변환하고 PDF 생성
export async function generatePDFFromHTML(htmlContent: string, options: PDFGeneratorOptions): Promise<Blob> {
  try {
    // 임시 컨테이너 생성
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '210mm' // A4 width
    container.innerHTML = htmlContent
    document.body.appendChild(container)

    // HTML을 Canvas로 변환
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Canvas를 PDF로 변환
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = 297 // A4 height in mm
    let heightLeft = imgHeight
    let position = 0

    // 첫 페이지 추가
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 추가 페이지 처리
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // 정리
    document.body.removeChild(container)

    // Blob 반환
    return pdf.output('blob')
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    throw new Error('PDF 생성에 실패했습니다')
  }
}

// 간단한 PDF 생성 (이미지 없이)
export function generateSimplePDF(options: PDFGeneratorOptions): Blob {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 폰트 설정
  pdf.setFont('helvetica')
  
  // 제목
  pdf.setFontSize(20)
  pdf.text('건설 공사 사진 대지', 105, 20, { align: 'center' })
  
  // 정보 테이블
  pdf.setFontSize(12)
  let y = 40
  pdf.text(`공사명: ${options.siteName}`, 20, y)
  pdf.text(`일자: ${options.reportDate}`, 120, y)
  y += 10
  pdf.text(`작성자: ${options.reporterName}`, 20, y)
  pdf.text(`총 항목: ${options.photoGroups.length}개`, 120, y)
  
  // 선 그리기
  y += 10
  pdf.line(20, y, 190, y)
  
  // 부재별 정보
  y += 10
  const groupedByComponent: Record<string, any[]> = {}
  options.photoGroups.forEach(group => {
    if (!groupedByComponent[group.component_name]) {
      groupedByComponent[group.component_name] = []
    }
    groupedByComponent[group.component_name].push(group)
  })

  const processLabels: Record<string, string> = {
    crack: '균열',
    surface: '면',
    finishing: '마감',
    other: '기타'
  }

  Object.entries(groupedByComponent).forEach(([componentName, groups]) => {
    if (y > 250) {
      pdf.addPage()
      y = 20
    }
    
    // 부재명
    pdf.setFontSize(14)
    pdf.text(componentName, 20, y)
    y += 10
    
    // 공정별 정보
    pdf.setFontSize(10)
    groups.forEach(group => {
      if (y > 270) {
        pdf.addPage()
        y = 20
      }
      
      const processName = processLabels[group.process_type] || group.process_type
      const beforeCount = group.before_photos?.length || 0
      const afterCount = group.after_photos?.length || 0
      
      pdf.text(`- ${processName}: 작업전 ${beforeCount}장, 작업후 ${afterCount}장`, 30, y)
      y += 7
    })
    
    y += 5
  })

  // 요약
  if (y > 240) {
    pdf.addPage()
    y = 20
  }
  
  y += 10
  pdf.line(20, y, 190, y)
  y += 10
  
  pdf.setFontSize(14)
  pdf.text('작업 요약', 20, y)
  y += 10
  
  pdf.setFontSize(10)
  const totalGroups = options.photoGroups.length
  const completedGroups = options.photoGroups.filter(g => g.progress_status === 'completed').length
  const totalBeforePhotos = options.photoGroups.reduce((sum, g) => sum + (g.before_photos?.length || 0), 0)
  const totalAfterPhotos = options.photoGroups.reduce((sum, g) => sum + (g.after_photos?.length || 0), 0)
  
  pdf.text(`총 항목: ${totalGroups}개`, 30, y)
  y += 7
  pdf.text(`완료 항목: ${completedGroups}개`, 30, y)
  y += 7
  pdf.text(`작업전 사진: ${totalBeforePhotos}장`, 30, y)
  y += 7
  pdf.text(`작업후 사진: ${totalAfterPhotos}장`, 30, y)

  return pdf.output('blob')
}