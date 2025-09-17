export type WorkReportStatus = 'draft' | 'completed'

export interface WorkReport {
  id: string
  siteName: string
  workDate: string
  author: string
  buildingName: string
  workProcess: string
  workType: string
  block: string
  dong: string
  ho: string
  manHours: number
  status: WorkReportStatus
  photos: string[]
  drawings: string[]
  completionDocs: string[]
  npcData: {
    inbound: string
    used: string
    stock: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface DraftSummary {
  year: number
  month: number
  count: number
  lastUpdated: Date
}
