export type WorkReportStatus = 'draft' | 'completed'

export interface WorkReport {
  id: string
  siteName: string
  workDate: string
  author: string
  buildingName: string
  memberType: string // 부재명 추가
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
    inbound: number
    used: number
    stock: number
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
