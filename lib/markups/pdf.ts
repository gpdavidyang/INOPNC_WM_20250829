import PDFDocument from 'pdfkit'
import { Buffer } from 'node:buffer'

export async function createPdfFromImageDataUrl(dataUrl: string) {
  const match = /^data:(.+);base64,(.+)$/i.exec(dataUrl || '')
  if (!match) return null
  const [, , base64] = match
  const imageBuffer = Buffer.from(base64, 'base64')
  return createPdfFromImageBuffer(imageBuffer)
}

export async function createPdfFromImageBuffer(imageBuffer: Buffer) {
  const doc = new PDFDocument({ autoFirstPage: false })
  const chunks: Buffer[] = []

  return await new Promise<Buffer | null>(resolve => {
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('error', err => {
      console.error('[markups/pdf] pdf generation failed', err)
      resolve(null)
    })
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    try {
      const image = (doc as any).openImage(imageBuffer)
      const width = image?.width || 612
      const height = image?.height || 792
      doc.addPage({ size: [width, height], margin: 0 })
      doc.image(image, 0, 0, { width, height })
    } catch (err) {
      console.error('[markups/pdf] unable to embed image in pdf', err)
      doc.addPage({ size: [612, 792], margin: 0 })
    }

    doc.end()
  })
}
