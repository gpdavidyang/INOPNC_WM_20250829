import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '../../../lib/utils/auth'

/**
 * Base admin action result type
 */
export interface AdminActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Wrapper function for admin actions that ensures proper authentication and error handling
 */
export async function withAdminAuth<T>(
  action: (supabase: any, profile: any) => Promise<AdminActionResult<T>>
): Promise<AdminActionResult<T>> {
  try {
    // Verify admin authentication
    const { profile } = await requireAdminAuth()

    // Create supabase client with service role key for admin operations
    // This bypasses RLS policies and allows admin to access all data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Execute the action
    const result = await action(supabase, profile)

    // Log admin action (for audit trail) - Only for critical operations
    if (shouldLogAction(action.name)) {
      logAdminActionAsync(supabase, profile.id, action.name, result.success)
    }

    return result
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin action error:', error)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Determine if an action should be logged for audit trail
 */
function shouldLogAction(actionName: string): boolean {
  // Only log critical operations, not read operations
  const criticalActions = [
    'createSite',
    'updateSite',
    'deleteSites',
    'updateSiteStatus',
    'assignUserToSite',
    'removeUserFromSite',
  ]
  return criticalActions.includes(actionName)
}

/**
 * Log admin actions for audit trail (async, non-blocking)
 */
function logAdminActionAsync(supabase: any, adminId: string, actionName: string, success: boolean) {
  // Use setTimeout to make this truly async and non-blocking
  setTimeout(async () => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: actionName,
        success,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      })
    } catch (error) {
      // Silently fail - don't log to console to reduce noise
      // In production, you might want to use a proper logging service
    }
  }, 0)
}

/**
 * Standard error messages
 */
export const AdminErrors = {
  UNAUTHORIZED: '권한이 없습니다',
  NOT_FOUND: '항목을 찾을 수 없습니다',
  VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다',
  DUPLICATE_ERROR: '이미 존재하는 항목입니다',
  FOREIGN_KEY_ERROR: '참조된 데이터가 있어 삭제할 수 없습니다',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
}

/**
 * Validation helpers
 */
export const validateRequired = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName}는 필수 입력 항목입니다`
  }
  return null
}

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식이 아닙니다'
  }
  return null
}

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[0-9-+().\s]+$/
  if (!phoneRegex.test(phone)) {
    return '올바른 전화번호 형식이 아닙니다'
  }
  return null
}
