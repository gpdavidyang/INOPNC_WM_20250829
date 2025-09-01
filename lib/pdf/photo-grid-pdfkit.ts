import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

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

export async function generatePhotoGridPDFKit(data: PhotoGridData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      // Try to register Korean font
      let koreanFont = 'Helvetica'
      try {
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Regular.ttf')
        if (fs.existsSync(fontPath)) {
          doc.registerFont('NotoSansKR', fontPath)
          koreanFont = 'NotoSansKR'
          console.log('Korean font registered successfully')
        }
      } catch (error) {
        console.warn('Korean font registration failed, using Helvetica:', error)
      }
      
      // Header
      doc.fontSize(24)
         .font(koreanFont)
         .text('사진대지', { align: 'center' })
         .moveDown(2)

      // Document info section
      doc.fontSize(14)
         .font(koreanFont)
         .text('문서 정보', 50, 120)
         .moveDown()

      const infoY = 145
      doc.fontSize(11)
         .font(koreanFont)

      // Info fields
      const drawInfoField = (label: string, value: string, x: number, y: number) => {
        doc.font(koreanFont)
           .text(`${label}:`, x, y)
           .font(koreanFont)
           .text(value || '-', x + 70, y)
      }

      // Left column
      drawInfoField('현장명', data.site?.name || '-', 50, infoY)
      drawInfoField('작업일자', data.work_date || '-', 50, infoY + 20)
      drawInfoField('부재명', data.component_name || '-', 50, infoY + 40)

      // Right column  
      drawInfoField('작업공정', data.work_process || '-', 300, infoY)
      drawInfoField('작업구간', data.work_section || '-', 300, infoY + 20)
      drawInfoField('작성자', data.creator?.full_name || '-', 300, infoY + 40)

      // Photos section
      const photoY = 260
      doc.fontSize(14)
         .font(koreanFont)
         .text('작업 사진', 50, photoY)

      // Photo dimensions
      const photoWidth = 200
      const photoHeight = 250
      const leftPhotoX = 50
      const rightPhotoX = 300

      // Before photo label
      doc.fontSize(12)
         .font(koreanFont)
         .text('작업 전', leftPhotoX + photoWidth/2 - 20, photoY + 30)

      // After photo label
      doc.text('작업 후', rightPhotoX + photoWidth/2 - 20, photoY + 30)

      // Draw photo frames
      doc.rect(leftPhotoX, photoY + 45, photoWidth, photoHeight).stroke()
      doc.rect(rightPhotoX, photoY + 45, photoWidth, photoHeight).stroke()

      // Load and add images
      try {
        if (data.before_photo_url) {
          const beforeResponse = await fetch(data.before_photo_url)
          if (beforeResponse.ok) {
            const beforeArrayBuffer = await beforeResponse.arrayBuffer()
            const beforeBuffer = Buffer.from(beforeArrayBuffer)
            
            // Calculate image dimensions to fit within frame
            doc.image(beforeBuffer, leftPhotoX + 5, photoY + 50, {
              fit: [photoWidth - 10, photoHeight - 10],
              align: 'center',
              valign: 'center'
            })
          }
        } else {
          // No image placeholder
          doc.fontSize(10)
             .font(koreanFont)
             .text('사진 없음', leftPhotoX + photoWidth/2 - 25, photoY + photoHeight/2 + 20)
        }

        if (data.after_photo_url) {
          const afterResponse = await fetch(data.after_photo_url)
          if (afterResponse.ok) {
            const afterArrayBuffer = await afterResponse.arrayBuffer()
            const afterBuffer = Buffer.from(afterArrayBuffer)
            
            doc.image(afterBuffer, rightPhotoX + 5, photoY + 50, {
              fit: [photoWidth - 10, photoHeight - 10],
              align: 'center', 
              valign: 'center'
            })
          }
        } else {
          // No image placeholder
          doc.fontSize(10)
             .font(koreanFont)
             .text('사진 없음', rightPhotoX + photoWidth/2 - 25, photoY + photoHeight/2 + 20)
        }
      } catch (imageError) {
        console.error('Error loading images:', imageError)
        // Continue without images
      }

      // Footer
      doc.fontSize(8)
         .font(koreanFont)
         .text(
           `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
           50, 
           750,
           { align: 'center', width: 500 }
         )

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}