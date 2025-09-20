import { createClient } from '@/lib/supabase/server'
import { getAuthForClient, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { createErrorResponse } from '@/lib/utils/api-response'
import { ErrorCodes } from '@/lib/errors'
import type { ApiResponse } from '@/types/utils'

/**
 * Authentication and authorization utilities
 */

export interface AuthResult {
  user: SimpleAuth
  profile: unknown
}

/**
 * Check if user is authenticated and has admin privileges
 */
export async function requireAdminAuth(): Promise<ApiResponse<AuthResult> | AuthResult> {
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)

    if (!auth) {
      return createErrorResponse('인증이 필요합니다.', ErrorCodes.UNAUTHORIZED)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', auth.userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return createErrorResponse('사용자 프로필을 찾을 수 없습니다.', ErrorCodes.RECORD_NOT_FOUND)
      }
      return createErrorResponse('프로필 조회 중 오류가 발생했습니다.', ErrorCodes.DATABASE_ERROR)
    }

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return createErrorResponse('관리자 권한이 필요합니다.', ErrorCodes.FORBIDDEN)
    }

    return { user: auth, profile }
  } catch (error) {
    return createErrorResponse('인증 처리 중 오류가 발생했습니다.', ErrorCodes.INTERNAL_ERROR)
  }
}

/**
 * Check if user has specific role
 */
export async function requireRole(allowedRoles: string[]): Promise<ApiResponse<AuthResult> | AuthResult> {
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)

    if (!auth) {
      return createErrorResponse('인증이 필요합니다.', ErrorCodes.UNAUTHORIZED)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', auth.userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return createErrorResponse('사용자 프로필을 찾을 수 없습니다.', ErrorCodes.RECORD_NOT_FOUND)
      }
      return createErrorResponse('프로필 조회 중 오류가 발생했습니다.', ErrorCodes.DATABASE_ERROR)
    }

    if (!profile || !allowedRoles.includes(profile.role)) {
      return createErrorResponse('권한이 부족합니다.', ErrorCodes.FORBIDDEN)
    }

    return { user: auth, profile }
  } catch (error) {
    return createErrorResponse('권한 확인 중 오류가 발생했습니다.', ErrorCodes.INTERNAL_ERROR)
  }
}

/**
 * Check if user is authenticated (no role check)
 */
export async function requireAuth(): Promise<ApiResponse<AuthResult> | AuthResult> {
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)

    if (!auth) {
      return createErrorResponse('인증이 필요합니다.', ErrorCodes.UNAUTHORIZED)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', auth.userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return createErrorResponse('사용자 프로필을 찾을 수 없습니다.', ErrorCodes.RECORD_NOT_FOUND)
      }
      return createErrorResponse('프로필 조회 중 오류가 발생했습니다.', ErrorCodes.DATABASE_ERROR)
    }

    return { user: auth, profile }
  } catch (error) {
    return createErrorResponse('인증 처리 중 오류가 발생했습니다.', ErrorCodes.INTERNAL_ERROR)
  }
}

/**
 * Helper to check if auth result is an error
 */
export function isAuthError(result: ApiResponse<AuthResult> | AuthResult): result is ApiResponse<AuthResult> {
  return 'success' in result && !result.success
}
