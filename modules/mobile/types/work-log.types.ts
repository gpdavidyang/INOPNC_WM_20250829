/**
 * 작업일지 관련 타입 정의
 */

/**
 * 작업일지 상태
 * draft: 임시
 * submitted: 제출
 * approved: 승인
 * rejected: 반려
 */
export type WorkLogStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

/**
 * 작업일지 탭 상태
 * draft: 작성중 (임시 상태 포함)
 * approved: 제출/승인
 */
export type WorkLogTabStatus = 'draft' | 'approved'

/**
 * 부재명 타입
 */
export type MemberType = '슬라브' | '거더' | '기둥' | '기타'

/**
 * 작업공정 타입
 */
export type WorkProcess = '균열' | '면' | '마감' | '기타'

/**
 * 작업유형 타입
 */
export type WorkType = '지하' | '지상' | '지붕' | '기타'

/**
 * 파일 첨부 타입
 */
export interface AttachedFile {
  id: string
  url: string
  name: string
  size: number
  uploadedAt?: string
  uploadedBy?: string
  documentType?: string
  metadata?: Record<string, any> | null
}

/**
 * 작업자 공수 정보
 */
export interface WorkerHours {
  id: string
  name: string
  hours: number
  role?: string
}

/**
 * 작업 위치 정보
 */
export interface WorkLocation {
  block: string // 블럭
  dong: string // 동
  unit: string // 층 (DB는 unit 필드 사용)
}

/**
 * 작업 세트(작업내용 기록 + 작업구간) 묶음
 */
export interface WorkTaskGroup {
  memberTypes: MemberType[]
  workProcesses: WorkProcess[]
  workTypes: WorkType[]
  location: WorkLocation
}

export interface MaterialUsageEntry {
  material_id?: string | null
  material_name: string
  material_code?: string | null
  quantity: number
  quantity_val?: number
  amount?: number
  unit?: string | null
  notes?: string | null
}

/**
 * 작업일지 첨부파일
 */
export interface WorkLogAttachments {
  photos: AttachedFile[] // 사진대지
  drawings: AttachedFile[] // 진행도면
  confirmations: AttachedFile[] // 작업완료확인서
  ptw?: AttachedFile[] // PTW (작업허가서)
  others?: AttachedFile[] // 기타 첨부파일
}

/**
 * 작업일지 메인 타입
 */
export interface WorkLog {
  id: string
  date: string
  siteId: string
  siteName: string
  siteAddress?: string
  siteStatus?: string | null
  organizationId?: string
  partnerCompanyName?: string
  title?: string
  author?: string
  status: WorkLogStatus

  // 작업 상세
  memberTypes: MemberType[] // 부재명 (다중선택)
  workProcesses: WorkProcess[] // 작업공정 (다중선택)
  workTypes: WorkType[] // 작업유형 (다중선택)
  location: WorkLocation // 작업 위치
  // 확장: 묶음 단위의 작업 세트(선택사항). 저장 시 work_content.tasks에 함께 기록.
  tasks?: WorkTaskGroup[]

  // 공수 정보
  workers: WorkerHours[]
  totalWorkers: number // 전체 인원수 (자동계산)
  totalHours: number // 전체 공수 (자동계산)

  // 자재 정보
  materials?: MaterialUsageEntry[]

  // 첨부파일
  attachments: WorkLogAttachments

  // 기타 정보
  progress: number // 진행률 (0-100)
  notes?: string // 비고
  description?: string // 작업 개요
  summary?: string // 리스트 표시용 요약

  // 메타 정보
  createdAt: string
  updatedAt: string
  createdBy: string
  rejectionReason?: string // 반려 사유
  updatedBy?: string
}

/**
 * 미작성 알림 데이터
 */
export interface UncompletedAlert {
  month: string // YYYY-MM 형식
  count: number
  workLogs: WorkLog[]
  dismissed: boolean // localStorage에 저장
  dismissedAt?: string
}

/**
 * 작업일지 필터 옵션
 */
export interface WorkLogFilter {
  status?: WorkLogStatus
  siteId?: string
  dateFrom?: string
  dateTo?: string
  searchQuery?: string
}

/**
 * 작업일지 정렬 옵션
 */
export interface WorkLogSort {
  field: 'date' | 'siteName' | 'status' | 'progress'
  order: 'asc' | 'desc'
}

/**
 * 파일 업로드 설정
 */
export interface FileUploadConfig {
  maxSize: number // bytes
  accept: string[] // MIME types
  multiple: boolean
  maxCount: number
}

/**
 * 파일 업로드 설정 맵
 */
export const FILE_UPLOAD_CONFIG: Record<keyof WorkLogAttachments, FileUploadConfig> = {
  photos: {
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    multiple: true,
    maxCount: 10,
  },
  drawings: {
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: ['application/pdf', 'image/jpeg', 'image/png'],
    multiple: false,
    maxCount: 1,
  },
  confirmations: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['application/pdf'],
    multiple: false,
    maxCount: 1,
  },
  ptw: {
    maxSize: 10 * 1024 * 1024,
    accept: ['application/pdf', 'image/jpeg', 'image/png'],
    multiple: true,
    maxCount: 5,
  },
  others: {
    maxSize: 20 * 1024 * 1024,
    accept: ['*/*'],
    multiple: true,
    maxCount: 10,
  },
}

/**
 * 작업일지 폼 데이터 (생성/수정용)
 */
export interface WorkLogFormData {
  date: string
  siteId: string
  memberTypes: MemberType[]
  workProcesses: WorkProcess[]
  workTypes: WorkType[]
  location: WorkLocation
  workers: WorkerHours[]
  materials?: MaterialUsageEntry[]
  progress: number
  notes?: string
}

/**
 * localStorage 키
 */
export const STORAGE_KEYS = {
  DISMISSED_ALERTS: 'worklog_uncompleted_dismiss',
  DRAFT_WORK_LOG: 'worklog_draft',
  RECENT_SITES: 'worklog_recent_sites',
} as const
