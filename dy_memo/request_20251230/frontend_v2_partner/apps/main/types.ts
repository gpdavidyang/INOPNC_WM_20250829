// Main App Types - for Worklog functionality

export interface Site {
  value: string
  text: string
  dept: string
}

export interface ManpowerItem {
  id: number
  worker: string
  workHours: number
  isCustom: boolean
  locked: boolean
}

export interface WorkSet {
  id: number
  member: string
  process: string
  type: string
  location: {
    block: string
    dong: string
    floor: string
  }
  isCustomMember: boolean
  isCustomProcess: boolean
  customMemberValue: string
  customProcessValue: string
  customTypeValue: string
}

export interface MaterialItem {
  id: number
  name: string
  qty: number
}

export interface PhotoData {
  img: string
  member: string
  process: string
  desc: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

// Search Types for GlobalSearch
export type SearchType = 'ALL' | 'SITE' | 'LOG' | 'DOC' | 'PHOTO' | 'DRAWING' | 'EXPENSE'

export interface ContentFlags {
  hasPhoto: boolean
  hasDraw: boolean
  hasDoc: boolean
}

export interface SearchRecord {
  id: string
  type: SearchType
  title: string
  subtitle: string
  meta: string
  flags: ContentFlags
  searchText: string
  score?: number
  timestamp: number
}

// Notification Types for Header
export type NotificationType = 'alert' | 'info' | 'success'

export interface HeaderNotificationItem {
  id: number
  type: NotificationType
  title: string
  desc: string
  time: string
  unread: boolean
}

// Dashboard Types from p-main
export interface SiteData {
  id: number
  name: string
  status: 'ing' | 'wait'
  days: number
  mp: number
  address: string
  worker: number
  manager: string
  safety: string
  affil: string
  lastUpdate: string
  hasDraw: boolean
  hasPhoto: boolean
  hasPTW: boolean
  hasLog: boolean
  hasAction: boolean
}

export interface NoticeItem {
  type: string
  text: string
  badgeClass: string
}
