import jsPDF from 'jspdf'

export interface PDFGeneratorOptions {
  title: string
  siteName: string
  reportDate: string
  reporterName: string
  photoGroups: unknown[]
}

// Canvas를 사용하여 한글 텍스트를 이미지로 렌더링한 후 PDF 생성
export async function generatePDFWithCanvas(options: PDFGeneratorOptions): Promise<Blob> {
  try {
    // Canvas 생성
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    // A4 크기 설정 (72 DPI 기준)
    const width = 595 // A4 width in points
    const height = 842 // A4 height in points
    canvas.width = width * 2 // 고해상도를 위해 2배
    canvas.height = height * 2
    ctx.scale(2, 2) // 스케일 조정

    // 배경색 설정
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)

    // 폰트 설정 (시스템 폰트 사용)
    ctx.font = 'bold 20px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    
    // 제목
    ctx.fillText('건설 공사 사진 대지', width / 2, 40)
    
    // 정보 테이블
    ctx.font = '12px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
    ctx.textAlign = 'left'
    
    let y = 80
    ctx.fillText(`공사명: ${options.siteName}`, 50, y)
    ctx.fillText(`일자: ${options.reportDate}`, 300, y)
    
    y += 25
    ctx.fillText(`작성자: ${options.reporterName}`, 50, y)
    ctx.fillText(`총 항목: ${options.photoGroups.length}개`, 300, y)
    
    // 구분선
    y += 20
    ctx.beginPath()
    ctx.moveTo(50, y)
    ctx.lineTo(width - 50, y)
    ctx.stroke()
    
    // 부재별 정보
    y += 30
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
      if (y > height - 100) {
        // 페이지 넘어감 처리가 필요하면 여기서 처리
        return
      }
      
      // 부재명
      ctx.font = 'bold 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
      ctx.fillText(componentName, 50, y)
      y += 25
      
      // 공정별 정보
      ctx.font = '11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
      groups.forEach(group => {
        if (y > height - 50) return
        
        const processName = processLabels[group.process_type] || group.process_type
        const beforeCount = group.before_photos?.length || 0
        const afterCount = group.after_photos?.length || 0
        
        ctx.fillText(`• ${processName}: 작업전 ${beforeCount}장, 작업후 ${afterCount}장`, 70, y)
        y += 20
      })
      
      y += 10
    })

    // 작업요약 섹션 제거됨

    // Canvas를 이미지로 변환
    const imgData = canvas.toDataURL('image/png')
    
    // PDF 생성
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })
    
    // 이미지를 PDF에 추가
    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    
    return pdf.output('blob')
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    throw new Error('PDF 생성에 실패했습니다')
  }
}

// HTML 테이블 기반 PDF 생성 (대체 방법)
export function generateHTMLBasedPDF(options: PDFGeneratorOptions): string {
  const processLabels: Record<string, string> = {
    crack: '균열',
    surface: '면', 
    finishing: '마감',
    other: '기타'
  }

  // 부재별로 그룹화
  const groupedByComponent: Record<string, any[]> = {}
  options.photoGroups.forEach(group => {
    if (!groupedByComponent[group.component_name]) {
      groupedByComponent[group.component_name] = []
    }
    groupedByComponent[group.component_name].push(group)
  })

  // HTML 생성
  let html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>건설 공사 사진 대지</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { 
          font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { text-align: center; margin-bottom: 30px; }
        .info-table {
          width: 100%;
          margin-bottom: 30px;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .info-table .label {
          font-weight: bold;
          width: 25%;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          padding: 5px;
          background-color: #f0f0f0;
        }
        .process-list {
          margin-left: 20px;
        }
        .process-item {
          margin: 5px 0;
        }
        .summary {
          margin-top: 40px;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .summary h3 {
          margin-bottom: 15px;
        }
        .summary-item {
          display: inline-block;
          margin: 10px 20px 10px 0;
        }
        @media print {
          body { margin: 0; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <h1>건설 공사 사진 대지</h1>
      
      <table class="info-table">
        <tr>
          <td class="label">공사명</td>
          <td>${options.siteName}</td>
          <td class="label">일자</td>
          <td>${options.reportDate}</td>
        </tr>
        <tr>
          <td class="label">작성자</td>
          <td>${options.reporterName}</td>
          <td class="label">총 항목</td>
          <td>${options.photoGroups.length}개</td>
        </tr>
      </table>
  `

  // 각 부재별 섹션 생성
  Object.entries(groupedByComponent).forEach(([componentName, groups]) => {
    html += `
      <div class="section">
        <div class="section-title">${componentName}</div>
        <div class="process-list">
    `
    
    groups.forEach(group => {
      const processName = processLabels[group.process_type] || group.process_type
      const beforeCount = group.before_photos?.length || 0
      const afterCount = group.after_photos?.length || 0
      
      html += `
        <div class="process-item">
          • ${processName}: 작업전 ${beforeCount}장, 작업후 ${afterCount}장
        </div>
      `
    })
    
    html += `
        </div>
      </div>
    `
  })

  // 요약 정보
  const totalGroups = options.photoGroups.length
  const completedGroups = options.photoGroups.filter(g => g.progress_status === 'completed').length
  const totalBeforePhotos = options.photoGroups.reduce((sum, g) => sum + (g.before_photos?.length || 0), 0)
  const totalAfterPhotos = options.photoGroups.reduce((sum, g) => sum + (g.after_photos?.length || 0), 0)

  // 작업요약 섹션 제거됨
  html += `
    </body>
    </html>
  `

  return html
}