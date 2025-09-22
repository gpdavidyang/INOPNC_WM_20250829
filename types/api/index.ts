/**
 * API 관련 공통 타입 정의
 */

// 기본 API 응답 타입
export interface ApiResponse<T = unknown> {
  data: T
  error?: string | null
  message?: string
  status: number
  success: boolean
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

// 에러 응답
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
  path?: string
}

// API 요청 옵션
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
  cache?: RequestCache
}

// 파일 업로드 응답
export interface FileUploadResponse {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

// 배치 작업 응답
export interface BatchOperationResponse {
  succeeded: number
  failed: number
  total: number
  errors?: Array<{
    item: unknown
    error: string
  }>
}

// Re-export specific API types
export * from './auth'
export * from './documents'
export * from './workers'
export * from './sites'
export * from './daily-reports'