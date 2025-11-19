import { createClient } from '@/lib/supabase/server'
import { normalizeUserRole } from '@/lib/auth/roles'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { AppError, ErrorType } from '@/lib/error-handling'
import { isDevelopmentAuthBypass, mockProfile } from '@/lib/dev-auth'

export { UI_TRACK_COOKIE_MAX_AGE, UI_TRACK_COOKIE_NAME } from './constants'

// UI 트랙 매핑 (DB 또는 환경 변수에서 로드 가능)
const UI_TRACKS: Record<string, string> = {
  worker: '/mobile',
  site_manager: '/mobile',
  production_manager: '/mobile/production/production', // 생산정보 페이지로 랜딩
  customer_manager: '/mobile/partner',
  partner: '/mobile/partner',
  admin: '/dashboard/admin',
  system_admin: '/dashboard/admin',
}

// Simple Auth 타입 정의
export interface SimpleAuth {
  userId: string
  email: string
  isRestricted: boolean // true = 시공업체 제한 계정(데이터 제한)
  restrictedOrgId?: string // 제한된 조직 ID
  uiTrack: string // UI 라우팅 경로
  role?: string // 원본 역할 (하위 호환성)
}

// 1. 인증 체크 (15줄)
export async function getAuth(): Promise<SimpleAuth | null> {
  const supabase = createClient()
  const auth = await fetchSimpleAuth(supabase)
  if (auth) return auth
  if (isDevelopmentAuthBypass()) {
    return buildDevSimpleAuth()
  }
  return null
}

export async function getAuthForClient(
  supabase: SupabaseClient<Database>
): Promise<SimpleAuth | null> {
  const auth = await fetchSimpleAuth(supabase)
  if (auth) return auth
  if (isDevelopmentAuthBypass()) {
    return buildDevSimpleAuth()
  }
  return null
}

async function fetchSimpleAuth(supabase: SupabaseClient<Database>): Promise<SimpleAuth | null> {
  let refreshAttempted = false

  while (true) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        if (isRecoverableAuthError(error)) {
          if (refreshAttempted) {
            console.warn('[auth] recoverable Supabase auth error persisted after refresh')
            return null
          }
          const refreshed = await tryRefreshSession(supabase)
          if (refreshed) {
            refreshAttempted = true
            continue
          }
          return null
        }
        throw error
      }

      if (!user) return null

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id, partner_company_id, full_name, site_id, status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if ((profileError as { code?: string }).code === 'PGRST116') {
          console.warn('[auth] profile lookup returned no rows for user, treating as signed out', {
            userId: user.id,
          })
          return null
        }
        if (isRecoverableAuthError(profileError)) {
          if (refreshAttempted) {
            console.warn('[auth] recoverable profile lookup error persisted after refresh')
            return null
          }
          const refreshed = await tryRefreshSession(supabase)
          if (refreshed) {
            refreshAttempted = true
            continue
          }
          return null
        }
        throw profileError
      }

      const normalizedRole = normalizeUserRole(profile?.role)

      return {
        userId: user.id,
        email: user.email!,
        isRestricted: normalizedRole === 'customer_manager',
        restrictedOrgId:
          (profile as any)?.partner_company_id || (profile as any)?.organization_id || undefined,
        uiTrack: getUITrack(normalizedRole),
        role: normalizedRole,
      }
    } catch (error) {
      if (isRecoverableAuthError(error)) {
        if (!refreshAttempted && (await tryRefreshSession(supabase))) {
          refreshAttempted = true
          continue
        }
        console.warn('[auth] recoverable Supabase auth exception, returning null session')
        return null
      }
      if (error instanceof Error) {
        if (error.name === 'AuthSessionMissingError') {
          return null
        }
        const message = error.message.toLowerCase()
        if (message.includes('invalid') && message.includes('jwt')) {
          return null
        }
      }
      throw error
    }
  }
}

function buildDevSimpleAuth(): SimpleAuth {
  const normalizedRole = normalizeUserRole(mockProfile.role)
  return {
    userId: mockProfile.id,
    email: mockProfile.email,
    isRestricted: normalizedRole === 'customer_manager',
    restrictedOrgId:
      (mockProfile as any)?.partner_company_id || mockProfile.organization_id || undefined,
    uiTrack: getUITrack(normalizedRole),
    role: normalizedRole,
  }
}

function isRecoverableAuthError(error: unknown): boolean {
  if (!error) return false
  const code = typeof (error as any)?.code === 'string' ? String((error as any).code) : ''
  if (code.toLowerCase().includes('refresh_token') || code === 'session_not_found') {
    return true
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('refresh token') ||
      message.includes('session not found') ||
      message.includes('session missing') ||
      message.includes('invalid jwt') ||
      message.includes('jwt expired')
    )
  }
  return false
}

async function tryRefreshSession(supabase: SupabaseClient<Database>): Promise<boolean> {
  try {
    console.warn('[auth] attempting Supabase session refresh due to recoverable error')
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.warn('[auth] session refresh failed:', error)
      return false
    }
    return Boolean(data?.session?.user)
  } catch (refreshError) {
    console.warn('[auth] session refresh threw an exception:', refreshError)
    return false
  }
}

// 2. UI 트랙 결정 (5줄)
function getUITrack(role?: string): string {
  const r = normalizeUserRole(role)
  return UI_TRACKS[r || 'worker'] || '/mobile'
}

// 3. 데이터 접근 체크 (10줄)
export async function canAccessData(auth: SimpleAuth | null, orgId?: string): Promise<boolean> {
  if (!auth) return false
  if (!auth.isRestricted) return true // 제한 계정이 아니면 모두 허용
  return auth.restrictedOrgId === orgId // 제한 계정은 자기 조직만
}

// 4. 페이지 보호 (Server Component용) (15줄)
export async function requireAuth(requiredTrack?: string): Promise<SimpleAuth> {
  const auth = await getAuth()

  if (!auth) {
    redirect('/auth/login')
  }

  // UI 트랙이 맞지 않으면 올바른 경로로 리다이렉트
  if (requiredTrack && !auth.uiTrack.includes(requiredTrack)) {
    redirect(auth.uiTrack)
  }

  return auth
}

// 5. API 보호 (Route Handler용) (15줄)
export async function requireApiAuth(orgId?: string): Promise<SimpleAuth | NextResponse> {
  const auth = await getAuth()

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 조직 기반 데이터 접근 체크
  if (orgId && !(await canAccessData(auth, orgId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return auth
}

/**
 * Server Action 혹은 Supabase 클라이언트가 이미 생성된 환경에서 인증을 강제합니다.
 * 인증 실패 시 AppError를 throw 하여 호출자가 적절히 처리할 수 있게 합니다.
 */
export async function requireServerActionAuth(
  supabase: SupabaseClient<Database>,
  orgId?: string
): Promise<SimpleAuth> {
  const auth = await getAuthForClient(supabase)

  if (!auth) {
    throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
  }

  if (orgId && !(await canAccessData(auth, orgId))) {
    throw new AppError('접근 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }

  return auth
}

/**
 * 조직 접근 권한을 검증하고, 위반 시 AppError를 발생시킵니다.
 */
export async function assertOrgAccess(auth: SimpleAuth, orgId?: string): Promise<void> {
  if (!orgId) {
    return
  }

  if (!(await canAccessData(auth, orgId))) {
    throw new AppError('접근 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

// 6. 로그아웃 (10줄)
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// Total: ~75 lines
