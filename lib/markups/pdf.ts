import PDFDocument from 'pdfkit'
import { Buffer } from 'node:buffer'

export async function createPdfFromImageDataUrl(dataUrl: string) {
  try {
    const match = /^data:(.+);base64,(.+)$/i.exec(dataUrl || '')
    if (!match) return null
    const [, , base64] = match
    const imageBuffer = Buffer.from(base64, 'base64')
    return await createPdfFromImageBuffer(imageBuffer)
  } catch (error) {
    console.error('[markups/pdf] pdf generation failed', error)
    return null
  }
}

export async function createPdfFromImageBuffer(imageBuffer: Buffer) {
  let doc: PDFDocument
  try {
    doc = new PDFDocument({ autoFirstPage: false })
  } catch (error) {
    console.error('[markups/pdf] unable to initialize pdf document', error)
    return null
  }

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
      try {
        doc.addPage({ size: [612, 792], margin: 0 })
      } catch (pageError) {
        console.error('[markups/pdf] unable to add fallback page', pageError)
        resolve(null)
        return
      }
    }

    try {
      doc.end()
    } catch (endError) {
      console.error('[markups/pdf] unable to finalize pdf', endError)
      resolve(null)
    }
  })
}
