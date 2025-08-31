import { createCanvas, loadImage, registerFont } from 'canvas'
import path from 'path'

// Register fonts if needed
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Regular.ttf')
  registerFont(fontPath, { family: 'Noto Sans KR' })
} catch (error) {
  console.warn('Font registration failed, using default font')
}

interface PhotoGridData {
  id: string
  site_id: string
  component_name: string
  work_process: string
  work_section?: string
  work_date: string
  before_photo_url?: string
  after_photo_url?: string
  site?: {
    name: string
    address?: string
  }
  creator?: {
    full_name: string
  }
}

export async function generatePhotoGridPDF(data: PhotoGridData): Promise<Buffer> {
  const width = 595 // A4 width in points
  const height = 842 // A4 height in points
  const canvas = createCanvas(width, height, 'pdf')
  const ctx = canvas.getContext('2d')

  // Set background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 24px "Noto Sans KR"'
  ctx.textAlign = 'center'
  ctx.fillText('사진대지', width / 2, 50)

  // Site information
  ctx.font = '14px "Noto Sans KR"'
  ctx.textAlign = 'left'
  
  let y = 90
  const lineHeight = 25
  
  // Draw info fields
  const drawField = (label: string, value: string) => {
    ctx.font = 'bold 12px "Noto Sans KR"'
    ctx.fillText(label + ':', 50, y)
    ctx.font = '12px "Noto Sans KR"'
    ctx.fillText(value || '-', 150, y)
    y += lineHeight
  }

  drawField('현장명', data.site?.name || '-')
  drawField('현장주소', data.site?.address || '-')
  drawField('작업일자', data.work_date || '-')
  drawField('부재명', data.component_name || '-')
  drawField('작업공정', data.work_process || '-')
  drawField('작업구간', data.work_section || '-')
  drawField('작성자', data.creator?.full_name || '-')

  // Photo section
  y += 20
  const photoWidth = (width - 120) / 2
  const photoHeight = 250
  const photoY = y

  // Before photo
  ctx.font = 'bold 14px "Noto Sans KR"'
  ctx.textAlign = 'center'
  ctx.fillText('작업 전', 50 + photoWidth / 2, photoY - 10)
  
  // Draw photo frame
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  ctx.strokeRect(50, photoY, photoWidth, photoHeight)

  if (data.before_photo_url) {
    try {
      const beforeImage = await loadImage(data.before_photo_url)
      
      // Calculate scaling to fit within frame
      const scale = Math.min(
        photoWidth / beforeImage.width,
        photoHeight / beforeImage.height
      )
      const scaledWidth = beforeImage.width * scale
      const scaledHeight = beforeImage.height * scale
      const offsetX = (photoWidth - scaledWidth) / 2
      const offsetY = (photoHeight - scaledHeight) / 2

      ctx.drawImage(
        beforeImage,
        50 + offsetX,
        photoY + offsetY,
        scaledWidth,
        scaledHeight
      )
    } catch (error) {
      console.error('Failed to load before photo:', error)
      ctx.fillStyle = '#666666'
      ctx.font = '12px "Noto Sans KR"'
      ctx.fillText('사진 로드 실패', 50 + photoWidth / 2, photoY + photoHeight / 2)
    }
  } else {
    ctx.fillStyle = '#666666'
    ctx.font = '12px "Noto Sans KR"'
    ctx.fillText('사진 없음', 50 + photoWidth / 2, photoY + photoHeight / 2)
  }

  // After photo
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 14px "Noto Sans KR"'
  ctx.fillText('작업 후', width - 50 - photoWidth / 2, photoY - 10)
  
  // Draw photo frame
  ctx.strokeStyle = '#cccccc'
  ctx.strokeRect(width - 50 - photoWidth, photoY, photoWidth, photoHeight)

  if (data.after_photo_url) {
    try {
      const afterImage = await loadImage(data.after_photo_url)
      
      // Calculate scaling to fit within frame
      const scale = Math.min(
        photoWidth / afterImage.width,
        photoHeight / afterImage.height
      )
      const scaledWidth = afterImage.width * scale
      const scaledHeight = afterImage.height * scale
      const offsetX = (photoWidth - scaledWidth) / 2
      const offsetY = (photoHeight - scaledHeight) / 2

      ctx.drawImage(
        afterImage,
        width - 50 - photoWidth + offsetX,
        photoY + offsetY,
        scaledWidth,
        scaledHeight
      )
    } catch (error) {
      console.error('Failed to load after photo:', error)
      ctx.fillStyle = '#666666'
      ctx.font = '12px "Noto Sans KR"'
      ctx.fillText('사진 로드 실패', width - 50 - photoWidth / 2, photoY + photoHeight / 2)
    }
  } else {
    ctx.fillStyle = '#666666'
    ctx.font = '12px "Noto Sans KR"'
    ctx.fillText('사진 없음', width - 50 - photoWidth / 2, photoY + photoHeight / 2)
  }

  // Footer
  ctx.fillStyle = '#666666'
  ctx.font = '10px "Noto Sans KR"'
  ctx.textAlign = 'center'
  ctx.fillText(
    `Generated on ${new Date().toLocaleDateString('ko-KR')}`,
    width / 2,
    height - 30
  )

  // Generate PDF buffer
  return canvas.toBuffer('application/pdf')
}