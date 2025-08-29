export type ExportFormat = 'excel' | 'pdf' | 'csv'

export interface ExportOptions {
  format: ExportFormat
  dateRange?: {
    start: string
    end: string
  }
  siteIds?: string[]
  status?: string[]
  includePhotos?: boolean
  includeDrawings?: boolean
  includeReceipts?: boolean
}

export interface ExportProgress {
  current: number
  total: number
  message: string
}

export interface ExportResult {
  success: boolean
  downloadUrl?: string
  fileName?: string
  error?: string
}