export interface WorkReportsTable {
  Row: {
    id: string
    daily_report_id: string
    file_url: string
    created_at: string
    created_by: string
    metadata: any
  }
  Insert: {
    id?: string
    daily_report_id: string
    file_url: string
    created_at?: string
    created_by?: string
    metadata?: any
  }
  Update: {
    id?: string
    daily_report_id?: string
    file_url?: string
    created_at?: string
    created_by?: string
    metadata?: any
  }
}
