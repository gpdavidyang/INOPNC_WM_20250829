export interface AttendanceRecord {
  id: string
  date: string
  workDate: string
  checkIn: string | null
  checkOut: string | null
  workHours: number
  laborHours: number
  overtimeHours: number
  status: string
  site_id: string | null
  siteId: string | null
  siteName: string
  siteAddress?: string | null
  workerName?: string | null
  notes?: string | null
  userId?: string | null
  profileId: string | null
  raw?: any
  isMe: boolean
}

export interface SiteOption {
  value: string
  label: string
}

export type SiteAssignmentRow = {
  site_id: string | null
  is_active: boolean | null
  sites?: {
    id?: string | null
    name?: string | null
  } | null
}

export interface CalendarDaySummary {
  date: Date
  iso: string
  isCurrentMonth: boolean
  isSunday: boolean
  totalHours: number
  totalManDays: number
  approvedManDays: number
  submittedManDays: number
  rejectedManDays: number
  sites: string[]
  hasRecords: boolean
}

export type AttendanceTab = 'work' | 'salary'
export type ViewMode = 'month' | 'week'
