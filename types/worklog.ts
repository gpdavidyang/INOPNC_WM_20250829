// Work Log Types for v2.0 Implementation

export interface WorkLogLocation {
  block: string // 블럭
  dong: string // 동
  unit: string // 호수
}

export interface WorkSection {
  id: string
  type: string // 작업 유형
  name: string // 작업 이름
  location: WorkLogLocation
}

export interface AdditionalManpower {
  id: string
  workerId: string
  workerName: string
  manpower: number // 공수 (0.5 단위)
}

export interface WorkLogPhotos {
  before: File[] // 보수 전
  after: File[] // 보수 후
  drawings: DrawingMark[]
}

export interface DrawingMark {
  id: string
  imageUrl: string
  marks: MarkPosition[]
  timestamp: string
}

export interface MarkPosition {
  id: string
  x: number
  y: number
  label?: string
}

export interface WorkLogState {
  // 기본 정보
  author: string
  date: string
  department: string // 소속 (이노피앤씨 본사, 코킹, 삼표피앤씨, 까뮤이엔씨)
  site: string // 현장

  // 위치 정보
  location: WorkLogLocation

  // 작업 정보
  memberType: string // 부재명 (슬라브, 거더, 벽체, 기둥)
  workContent: string // 작업 내용
  workSections: WorkSection[] // 작업구간들

  // 공수 정보
  manpower: {
    main: number // 기본 공수 (0.5 단위)
    additional: AdditionalManpower[] // 추가 공수
  }

  // 파일 정보
  photos: WorkLogPhotos

  // 비고
  notes?: string
}

// 드롭다운 옵션들
export const DEPARTMENTS = [
  { value: 'inopnc_hq', label: '이노피앤씨 본사' },
  { value: 'inopnc_coking', label: '이노피앤씨 코킹' },
  { value: 'sampyo_pnc', label: '삼표피앤씨' },
  { value: 'camu_enc', label: '까뮤이엔씨' },
] as const

export const MEMBER_TYPES = [
  { value: 'slab', label: '슬라브' },
  { value: 'girder', label: '보' },
  { value: 'wall', label: '벽' },
  { value: 'column', label: '기둥' },
  { value: 'foundation', label: '기초' },
  { value: 'stair', label: '계단' },
  { value: 'roof', label: '지붕' },
  { value: 'balcony', label: '발코니' },
  { value: 'other', label: '기타' },
] as const

// 공수 값 옵션 (0.5 단위)
export const MANPOWER_VALUES = [0, 0.5, 1, 1.5, 2, 2.5, 3] as const

// ==================== v3 UI Data Models ====================

export type WorklogStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface WorklogAttachment {
  id: string
  name: string
  type: 'photo' | 'drawing' | 'document'
  category: 'before' | 'after' | 'markup' | 'completion' | 'other'
  previewUrl?: string
  fileUrl: string
}

export interface WorklogSummary {
  id: string
  siteId: string
  siteName: string
  workDate: string
  memberTypes: string[]
  processes: string[]
  workTypes: string[]
  manpower: number
  status: WorklogStatus
  attachmentCounts: {
    photos: number
    drawings: number
    completionDocs: number
    others: number
  }
  createdBy: {
    id: string
    name: string
  }
  updatedAt: string
}

export interface WorklogDetail extends WorklogSummary {
  siteAddress?: string
  location: {
    block: string
    dong: string
    unit: string
  }
  // 확장: 작업 세트 묶음
  tasks?: Array<{
    memberTypes: string[]
    processes: string[]
    workTypes: string[]
    location: { block: string; dong: string; unit: string }
  }>
  notes?: string
  safetyNotes?: string
  additionalManpower: Array<{
    id: string
    name: string
    manpower: number
  }>
  attachments: {
    photos: WorklogAttachment[]
    drawings: WorklogAttachment[]
    completionDocs: WorklogAttachment[]
    others: WorklogAttachment[]
  }
}

export interface WorklogCalendarCell {
  date: string
  total: number
  submitted: number
  draft: number
}
