import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  requireServerActionAuth,
  type SimpleAuth,
} from '@/lib/auth/ultra-simple'
import { AppError, ErrorType, logError } from '@/lib/error-handling'
import type { Database } from '@/types/database'

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
  action: (
    supabase: SupabaseClient<Database>,
    profile: AdminProfile & { auth: SimpleAuth }
  ) => Promise<AdminActionResult<T>>
): Promise<AdminActionResult<T>> {
  try {
    const { auth, profile } = await getAdminContext()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new AppError('Supabase 서비스 구성이 누락되었습니다.', ErrorType.SERVER_ERROR, 500)
    }

    const supabase = createServiceClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Execute the action
    const result = await action(supabase, { ...profile, auth })

    // Log admin action (for audit trail) - Only for critical operations
    if (shouldLogAction(action.name)) {
      logAdminActionAsync(supabase, profile.id, action.name, result.success)
    }

    return result
  } catch (error) {
    logError(error, 'withAdminAuth')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Unknown error occurred',
    }
  }
}

interface AdminProfile {
  id: string
  role: string
  email?: string | null
  full_name?: string | null
}

async function getAdminContext(): Promise<{ auth: SimpleAuth; profile: AdminProfile }> {
  const supabase = createServerClient()
  const auth = await requireServerActionAuth(supabase)

  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    throw new AppError('관리자 권한이 필요합니다.', ErrorType.AUTHORIZATION, 403)
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', auth.userId)
    .single()

  if (error || !profile) {
    throw new AppError('관리자 프로필을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  return { auth, profile }
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

export function requireRestrictedOrgId(auth: SimpleAuth): string {
  if (!auth.restrictedOrgId) {
    throw new AppError('조직 정보가 필요합니다.', ErrorType.AUTHORIZATION, 403)
  }
  return auth.restrictedOrgId
}

export function resolveAdminError(error: unknown, fallback = AdminErrors.UNKNOWN_ERROR): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }

    if ('type' in error) {
      const typed = error as { message?: unknown }
      if (typeof typed.message === 'string') {
        return typed.message
      }
    }
  }

  return fallback
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
