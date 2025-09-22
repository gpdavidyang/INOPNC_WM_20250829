import { WorkLog, WorkLogStatus, WorkerHours, STORAGE_KEYS } from '../types/work-log.types'

// 캐시를 위한 WeakMap/Map 객체들 - 메모리 최적화
const dateFormatCache = new Map<string, string>()
const monthFormatCache = new Map<string, string>()
const fileSizeCache = new Map<number, string>()

// 캐시 크기 제한 상수
const MAX_DATE_CACHE_SIZE = 100
const MAX_MONTH_CACHE_SIZE = 50
const MAX_FILE_SIZE_CACHE_SIZE = 200

// localStorage 캐시 - 메모리 누수 방지
const localStorageCache = new Map<string, any>()
let lastCacheUpdate = 0
const CACHE_DURATION = 5000 // 5초 캐시

// 캐시 정리 함수
const clearOldCacheEntries = () => {
  const now = Date.now()
  if (now - lastCacheUpdate > CACHE_DURATION * 10) {
    // 50초마다 정리
    localStorageCache.clear()
    lastCacheUpdate = now
  }
}

/**
 * 안전한 localStorage 접근
 */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      const now = Date.now()

      // 캐시가 유효한 경우
      if (now - lastCacheUpdate < CACHE_DURATION && localStorageCache.has(key)) {
        return localStorageCache.get(key)
      }

      // localStorage에서 읽기
      const value = localStorage.getItem(key)

      // 캐시 업데이트
      localStorageCache.set(key, value)
      lastCacheUpdate = now

      return value
    } catch (error) {
      console.warn('localStorage getItem failed:', error)
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
      // 캐시도 업데이트
      localStorageCache.set(key, value)
    } catch (error) {
      console.warn('localStorage setItem failed:', error)
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
      // 캐시에서도 제거
      localStorageCache.delete(key)
    } catch (error) {
      console.warn('localStorage removeItem failed:', error)
    }
  },
}

/**
 * 날짜 포맷팅 (메모이제이션 적용)
 */
export const formatDate = (date: string): string => {
  if (dateFormatCache.has(date)) {
    return dateFormatCache.get(date)!
  }

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const formatted = `${year}.${month}.${day}`

  // 캐시 크기 제한 (최대 100개)
  if (dateFormatCache.size >= 100) {
    const firstKey = dateFormatCache.keys().next().value
    dateFormatCache.delete(firstKey)
  }

  dateFormatCache.set(date, formatted)
  return formatted
}

/**
 * 월 포맷팅 (메모이제이션 적용)
 */
export const formatMonth = (date: string): string => {
  if (monthFormatCache.has(date)) {
    return monthFormatCache.get(date)!
  }

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const formatted = `${year}년 ${month}월`

  // 캐시 크기 제한 (최대 50개)
  if (monthFormatCache.size >= 50) {
    const firstKey = monthFormatCache.keys().next().value
    monthFormatCache.delete(firstKey)
  }

  monthFormatCache.set(date, formatted)
  return formatted
}

/**
 * 파일 크기 포맷팅 (메모이제이션 적용)
 */
export const formatFileSize = (bytes: number): string => {
  if (fileSizeCache.has(bytes)) {
    return fileSizeCache.get(bytes)!
  }

  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formatted = `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`

  // 캐시 크기 제한 (최대 200개)
  if (fileSizeCache.size >= 200) {
    const firstKey = fileSizeCache.keys().next().value
    fileSizeCache.delete(firstKey)
  }

  fileSizeCache.set(bytes, formatted)
  return formatted
}

/**
 * 상태별 색상 클래스 - HTML 참조 파일 기반
 */
export const getStatusColor = (status: WorkLogStatus): string => {
  switch (status) {
    case 'draft':
      return 'bg-[rgba(255,45,128,0.15)] text-[#FF2980]'
    case 'approved':
      return 'bg-[rgba(20,184,166,0.15)] text-[#14B8A6]'
    default:
      return 'bg-[#f5f7fb] text-[#667085]'
  }
}

/**
 * 상태 텍스트
 */
export const getStatusText = (status: WorkLogStatus): string => {
  switch (status) {
    case 'draft':
      return '임시저장'
    case 'approved':
      return '작성완료'
    default:
      return '알 수 없음'
  }
}

/**
 * 진행률 색상 클래스
 */
export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-500'
  if (progress >= 50) return 'bg-[var(--num)]'
  if (progress >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * 전체 공수 계산
 */
export const calculateTotalHours = (workers: WorkerHours[]): number => {
  return workers.reduce((total, worker) => total + worker.hours, 0)
}

/**
 * 작업일지를 월별로 그룹화 (성능 최적화)
 */
export const groupWorkLogsByMonth = (workLogs: WorkLog[]): Record<string, WorkLog[]> => {
  if (!workLogs.length) return {}

  // Map을 사용하여 성능 개선
  const groups = new Map<string, WorkLog[]>()

  for (const log of workLogs) {
    const month = log.date.substring(0, 7) // YYYY-MM
    const existing = groups.get(month)
    if (existing) {
      existing.push(log)
    } else {
      groups.set(month, [log])
    }
  }

  // Map을 Record로 변환
  return Object.fromEntries(groups)
}

/**
 * 미작성 알림 해제 여부 확인
 */
export const isAlertDismissed = (month: string): boolean => {
  const dismissData = localStorage.getItem(STORAGE_KEYS.DISMISSED_ALERTS)
  if (!dismissData) return false

  try {
    const parsed = JSON.parse(dismissData)
    const today = new Date().toISOString().split('T')[0]

    // 오늘 해제한 경우만 유효
    if (parsed.date === today && parsed.months?.includes(month)) {
      return true
    }
  } catch {
    // 파싱 에러 무시
  }

  return false
}

/**
 * 미작성 알림 해제 저장
 */
export const dismissAlert = (month: string): void => {
  const dismissData = localStorage.getItem(STORAGE_KEYS.DISMISSED_ALERTS)
  const today = new Date().toISOString().split('T')[0]

  const data = { date: today, months: [month] }

  if (dismissData) {
    try {
      const parsed = JSON.parse(dismissData)
      if (parsed.date === today) {
        data.months = [...new Set([...parsed.months, month])]
      }
    } catch {
      // 파싱 에러 무시
    }
  }

  localStorage.setItem(STORAGE_KEYS.DISMISSED_ALERTS, JSON.stringify(data))
}

/**
 * 작업일지 임시저장 로드
 */
export const loadDraftWorkLog = (): Partial<WorkLog> | null => {
  const draft = localStorage.getItem(STORAGE_KEYS.DRAFT_WORK_LOG)
  if (!draft) return null

  try {
    return JSON.parse(draft)
  } catch {
    return null
  }
}

/**
 * 작업일지 임시저장
 */
export const saveDraftWorkLog = (workLog: Partial<WorkLog>): void => {
  localStorage.setItem(STORAGE_KEYS.DRAFT_WORK_LOG, JSON.stringify(workLog))
}

/**
 * 작업일지 임시저장 삭제
 */
export const clearDraftWorkLog = (): void => {
  localStorage.removeItem(STORAGE_KEYS.DRAFT_WORK_LOG)
}

/**
 * 최근 사용 현장 저장
 */
export const saveRecentSite = (siteId: string, siteName: string): void => {
  const recentSites = loadRecentSites()
  const newSite = { id: siteId, name: siteName, usedAt: new Date().toISOString() }

  // 중복 제거 및 최신 순 정렬
  const filtered = recentSites.filter(site => site.id !== siteId)
  const updated = [newSite, ...filtered].slice(0, 5) // 최대 5개 저장

  localStorage.setItem(STORAGE_KEYS.RECENT_SITES, JSON.stringify(updated))
}

/**
 * 최근 사용 현장 로드
 */
export const loadRecentSites = (): Array<{ id: string; name: string; usedAt: string }> => {
  const data = localStorage.getItem(STORAGE_KEYS.RECENT_SITES)
  if (!data) return []

  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

/**
 * 파일 확장자 추출
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * 파일 타입 아이콘 클래스
 */
export const getFileIconClass = (filename: string): string => {
  const ext = getFileExtension(filename)

  switch (ext) {
    case 'pdf':
      return 'text-red-500'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'text-[var(--num)]'
    default:
      return 'text-[var(--muted)]'
  }
}

/**
 * 작업일지 검증
 */
export const validateWorkLog = (workLog: Partial<WorkLog>): string[] => {
  const errors: string[] = []

  if (!workLog.date) errors.push('작업일자를 선택해주세요.')
  if (!workLog.siteId) errors.push('현장을 선택해주세요.')
  if (!workLog.memberTypes || workLog.memberTypes.length === 0) {
    errors.push('부재명을 선택해주세요.')
  }
  if (!workLog.workProcesses || workLog.workProcesses.length === 0) {
    errors.push('작업공정을 선택해주세요.')
  }
  if (!workLog.workTypes || workLog.workTypes.length === 0) {
    errors.push('작업유형을 선택해주세요.')
  }
  if (!workLog.location?.block || !workLog.location?.dong || !workLog.location?.unit) {
    errors.push('블럭/동/호수를 모두 입력해주세요.')
  }
  if (!workLog.workers || workLog.workers.length === 0) {
    errors.push('작업자를 추가해주세요.')
  }
  if (workLog.progress === undefined || workLog.progress < 0 || workLog.progress > 100) {
    errors.push('진행률을 0-100 사이로 입력해주세요.')
  }

  return errors
}
