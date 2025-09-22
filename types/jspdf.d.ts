declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'portrait' | 'p' | 'landscape' | 'l'
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc'
    format?: string | number[]
    compress?: boolean
    precision?: number
    userUnit?: number
  }

  export default class jsPDF {
    constructor(options?: jsPDFOptions)
    
    addPage(format?: string | number[], orientation?: 'portrait' | 'p' | 'landscape' | 'l'): jsPDF
    setFontSize(size: number): jsPDF
    setFont(fontName: string, fontStyle?: string, fontWeight?: string | number): jsPDF
    text(text: string | string[], x: number, y: number, options?: any): jsPDF
    line(x1: number, y1: number, x2: number, y2: number): jsPDF
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF
    output(type: 'blob'): Blob
    output(type: 'bloburi' | 'bloburl'): string
    output(type: 'datauristring' | 'dataurlstring'): string
    output(type: 'arraybuffer'): ArrayBuffer
    output(type: 'save', filename?: string): jsPDF
  }
}