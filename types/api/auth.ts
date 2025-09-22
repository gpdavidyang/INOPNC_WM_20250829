/**
 * 인증 관련 API 타입 정의
 */


// 사용자 역할
export type UserRole = 'admin' | 'site_manager' | 'worker' | 'customer_manager' | 'partner' | 'accountant' | 'executive'

// 로그인 요청
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

// 로그인 응답
export interface LoginResponse {
  user: AuthUser
  session: Session
  accessToken: string
  refreshToken?: string
}

// 인증된 사용자 정보
export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string | null
  profile_image?: string | null
  organization_id?: string | null
  site_id?: string | null
  created_at: string
  updated_at: string
  last_login?: string | null
  is_active: boolean
}

// 세션 정보
export interface Session {
  id: string
  userId: string
  expiresAt: string
  createdAt: string
  ipAddress?: string
  userAgent?: string
}

// 회원가입 요청
export interface SignupRequest {
  email: string
  password: string
  full_name: string
  phone?: string
  role: UserRole
  organization_name?: string
  site_id?: string
}

// 비밀번호 재설정 요청
export interface ResetPasswordRequest {
  email: string
}

// 비밀번호 변경 요청
export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 토큰 갱신 요청
export interface RefreshTokenRequest {
  refreshToken: string
}

// 프로필 업데이트 요청
export interface UpdateProfileRequest {
  full_name?: string
  phone?: string
  profile_image?: string
  notification_settings?: Record<string, boolean>
}

// 권한 체크 응답
export interface PermissionCheckResponse {
  hasPermission: boolean
  requiredRole?: UserRole
  userRole: UserRole
}