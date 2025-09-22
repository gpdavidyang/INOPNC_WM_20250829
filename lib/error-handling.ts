
// Error types
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Error messages in Korean
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: '로그인이 필요합니다.',
  [ErrorType.AUTHORIZATION]: '권한이 없습니다.',
  [ErrorType.VALIDATION]: '입력값을 확인해 주세요.',
  [ErrorType.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ErrorType.SERVER_ERROR]: '서버 오류가 발생했습니다.',
  [ErrorType.NETWORK_ERROR]: '네트워크 연결을 확인해 주세요.',
  [ErrorType.UNKNOWN]: '알 수 없는 오류가 발생했습니다.'
}

// Get user-friendly error message
export function getUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message || errorMessages[error.type]
  }
  
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('Failed to fetch')) {
      return errorMessages[ErrorType.NETWORK_ERROR]
    }
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return errorMessages[ErrorType.AUTHENTICATION]
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return errorMessages[ErrorType.AUTHORIZATION]
    }
    if (error.message.includes('404')) {
      return errorMessages[ErrorType.NOT_FOUND]
    }
    if (error.message.includes('500')) {
      return errorMessages[ErrorType.SERVER_ERROR]
    }
    
    return error.message
  }
  
  return errorMessages[ErrorType.UNKNOWN]
}

// Error logging
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry, LogRocket, etc.
    console.error('[Production Error]', errorInfo)
  } else {
    console.error('[Development Error]', errorInfo)
  }
}

// Show error notification
export function showErrorNotification(error: unknown, context?: string) {
  const message = getUserErrorMessage(error)
  
  if (context) {
    logError(error, context)
  }
  
  toast.error(message, {
    duration: 5000,
    action: {
      label: '닫기',
      onClick: () => {}
    }
  })
}

// Handle async errors
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    logError(error, context)
    return [null, error as Error]
  }
}

// Retry failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}

// Validate Supabase response
export function validateSupabaseResponse<T>(
  data: T | null,
  error: unknown
): T {
  if (error) {
    if (error.code === 'PGRST301') {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }
    if (error.code === '42501') {
      throw new AppError('권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }
    throw new AppError(error.message || '데이터베이스 오류가 발생했습니다.', ErrorType.SERVER_ERROR, 500)
  }
  
  if (!data) {
    throw new AppError('데이터를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }
  
  return data
}

// Form validation error handling
export function getFieldError(errors: Record<string, unknown>, field: string): string | undefined {
  const error = errors[field]
  if (!error) return undefined
  
  if (typeof error === 'string') return error
  if (error.message) return error.message
  if (error.type === 'required') return '필수 입력 항목입니다.'
  if (error.type === 'minLength') return `최소 ${error.minLength}자 이상 입력해주세요.`
  if (error.type === 'maxLength') return `최대 ${error.maxLength}자까지 입력 가능합니다.`
  if (error.type === 'pattern') return '올바른 형식으로 입력해주세요.'
  
  return '입력값을 확인해주세요.'
}