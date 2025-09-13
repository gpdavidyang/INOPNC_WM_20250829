/**
 * Error handling utilities for NPC-1000 management system
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export class AppError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly isOperational: boolean

  constructor(message: string, code: string, status: number = 500, isOperational: boolean = true) {
    super(message)
    this.code = code
    this.status = status
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  
  // Business logic errors
  INSUFFICIENT_INVENTORY: 'INSUFFICIENT_INVENTORY',
  INVALID_OPERATION: 'INVALID_OPERATION',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const

export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: '인증이 필요합니다.',
  [ErrorCodes.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCodes.INVALID_TOKEN]: '유효하지 않은 토큰입니다.',
  
  [ErrorCodes.VALIDATION_ERROR]: '입력값이 올바르지 않습니다.',
  [ErrorCodes.INVALID_INPUT]: '잘못된 입력값입니다.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: '필수 필드가 누락되었습니다.',
  
  [ErrorCodes.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
  [ErrorCodes.RECORD_NOT_FOUND]: '요청한 데이터를 찾을 수 없습니다.',
  [ErrorCodes.CONSTRAINT_VIOLATION]: '데이터 제약 조건을 위반했습니다.',
  [ErrorCodes.TRANSACTION_FAILED]: '트랜잭션 처리에 실패했습니다.',
  
  [ErrorCodes.INSUFFICIENT_INVENTORY]: '재고가 부족합니다.',
  [ErrorCodes.INVALID_OPERATION]: '유효하지 않은 작업입니다.',
  [ErrorCodes.CONCURRENT_MODIFICATION]: '동시 수정으로 인한 충돌이 발생했습니다.',
  
  [ErrorCodes.INTERNAL_ERROR]: '내부 서버 오류가 발생했습니다.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: '서비스를 사용할 수 없습니다.',
  [ErrorCodes.TIMEOUT]: '요청 시간이 초과되었습니다.',
}

/**
 * Handle errors consistently across the application
 */
export function handleError(error: unknown): ApiResponse {
  console.error('Application error:', error)
  
  // Handle known AppError instances
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
  
  // Handle Supabase errors
  if (error?.code) {
    const supabaseErrorMap: Record<string, { message: string; code: string }> = {
      '23505': { message: '중복된 데이터입니다.', code: ErrorCodes.CONSTRAINT_VIOLATION },
      '23502': { message: '필수 데이터가 누락되었습니다.', code: ErrorCodes.MISSING_REQUIRED_FIELD },
      '23503': { message: '참조 무결성 오류입니다.', code: ErrorCodes.CONSTRAINT_VIOLATION },
      'PGRST116': { message: '요청한 데이터를 찾을 수 없습니다.', code: ErrorCodes.RECORD_NOT_FOUND },
    }
    
    const mappedError = supabaseErrorMap[error.code]
    if (mappedError) {
      return {
        success: false,
        error: mappedError.message,
        code: mappedError.code
      }
    }
  }
  
  // Handle network and timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT') {
    return {
      success: false,
      error: ErrorMessages[ErrorCodes.TIMEOUT],
      code: ErrorCodes.TIMEOUT
    }
  }
  
  // Default error response
  return {
    success: false,
    error: ErrorMessages[ErrorCodes.INTERNAL_ERROR],
    code: ErrorCodes.INTERNAL_ERROR
  }
}

/**
 * Validate required fields
 */
export function validateRequired<T>(
  data: T,
  requiredFields: Array<keyof T>
): ApiResponse | null {
  const missingFields = requiredFields.filter(field => 
    data[field] === null || 
    data[field] === undefined || 
    (typeof data[field] === 'string' && (data[field] as string).trim() === '')
  )
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
      code: ErrorCodes.MISSING_REQUIRED_FIELD
    }
  }
  
  return null
}

/**
 * Validate numeric values
 */
export function validateNumber(
  value: any,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): ApiResponse | null {
  const num = Number(value)
  
  if (isNaN(num)) {
    return {
      success: false,
      error: `${fieldName}는 숫자여야 합니다.`,
      code: ErrorCodes.VALIDATION_ERROR
    }
  }
  
  if (options.integer && !Number.isInteger(num)) {
    return {
      success: false,
      error: `${fieldName}는 정수여야 합니다.`,
      code: ErrorCodes.VALIDATION_ERROR
    }
  }
  
  if (options.min !== undefined && num < options.min) {
    return {
      success: false,
      error: `${fieldName}는 ${options.min} 이상이어야 합니다.`,
      code: ErrorCodes.VALIDATION_ERROR
    }
  }
  
  if (options.max !== undefined && num > options.max) {
    return {
      success: false,
      error: `${fieldName}는 ${options.max} 이하여야 합니다.`,
      code: ErrorCodes.VALIDATION_ERROR
    }
  }
  
  return null
}

/**
 * Validate date strings
 */
export function validateDate(value: string, fieldName: string): ApiResponse | null {
  if (!value || value.trim() === '') {
    return {
      success: false,
      error: `${fieldName}는 필수입니다.`,
      code: ErrorCodes.MISSING_REQUIRED_FIELD
    }
  }
  
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return {
      success: false,
      error: `${fieldName}는 올바른 날짜 형식이어야 합니다.`,
      code: ErrorCodes.VALIDATION_ERROR
    }
  }
  
  return null
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data?: T): ApiResponse<T> {
  return {
    success: true,
    data
  }
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, code: string = ErrorCodes.INTERNAL_ERROR): ApiResponse {
  return {
    success: false,
    error: message,
    code
  }
}

/**
 * Retry utility for database operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on certain error types
      if (error instanceof AppError && !error.isOperational) {
        throw error
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  throw lastError
}

/**
 * Transaction wrapper with automatic rollback
 */
export async function withTransaction<T>(
  supabase: any,
  operation: (client: any) => Promise<T>
): Promise<T> {
  // Note: Supabase doesn't support explicit transactions in the client
  // This is a placeholder for when we need to implement transaction logic
  return await operation(supabase)
}