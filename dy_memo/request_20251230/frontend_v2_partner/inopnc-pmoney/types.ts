export interface WorkEntry {
  site: string
  man: number // Stored as number for calculation
  price: number
}

export interface PartnerCalendarData {
  amt: string
  site: string
  man: string // Stored as string in the provided HTML data
  note: string
}

export interface PartnerCalendarMap {
  [date: string]: PartnerCalendarData
}

export interface WorkDataMap {
  [date: string]: WorkEntry[]
}

export interface SalaryHistoryItem {
  rawDate: string
  month: string
  baseTotal: number
  man: number
  price: number
}
