/**
 * Auth Provider Types and Interfaces
 *
 * Defines the contract for authentication providers.
 * Enables abstraction of auth implementation details.
 */

import { User } from '@supabase/supabase-js'

/**
 * Authentication result types
 */
export interface AuthUser {
  id: string
  email?: string
  phone?: string
  role?: string
  metadata?: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  expiresIn?: number
}

export interface AuthError {
  code: string
  message: string
  status?: number
  details?: any
}

export interface AuthResponse<T = any> {
  data?: T
  error?: AuthError
}

/**
 * Sign in/up credentials
 */
export interface EmailPasswordCredentials {
  email: string
  password: string
}

export interface PhonePasswordCredentials {
  phone: string
  password: string
}

export interface OAuthCredentials {
  provider: 'google' | 'github' | 'kakao' | 'naver'
  redirectTo?: string
}

export type SignInCredentials =
  | EmailPasswordCredentials
  | PhonePasswordCredentials
  | OAuthCredentials

/**
 * Sign up data
 */
export interface SignUpData extends EmailPasswordCredentials {
  metadata?: {
    full_name?: string
    avatar_url?: string
    [key: string]: any
  }
}

/**
 * Password reset
 */
export interface PasswordResetRequest {
  email: string
  redirectTo?: string
}

export interface PasswordUpdateRequest {
  newPassword: string
  accessToken?: string
}

/**
 * Main Auth Provider Interface
 */
export interface IAuthProvider {
  // Session management
  getSession(): Promise<AuthResponse<AuthSession>>
  refreshSession(refreshToken?: string): Promise<AuthResponse<AuthSession>>
  setSession(accessToken: string, refreshToken?: string): Promise<AuthResponse<AuthSession>>
  clearSession(): Promise<void>

  // Authentication
  signInWithPassword(
    credentials: EmailPasswordCredentials | PhonePasswordCredentials
  ): Promise<AuthResponse<AuthSession>>
  signInWithOAuth(credentials: OAuthCredentials): Promise<AuthResponse<{ url: string }>>
  signInWithOtp(email: string): Promise<AuthResponse<void>>
  verifyOtp(email: string, token: string): Promise<AuthResponse<AuthSession>>

  // Registration
  signUp(data: SignUpData): Promise<AuthResponse<AuthSession>>

  // Sign out
  signOut(): Promise<AuthResponse<void>>

  // Password management
  resetPasswordForEmail(request: PasswordResetRequest): Promise<AuthResponse<void>>
  updatePassword(request: PasswordUpdateRequest): Promise<AuthResponse<AuthUser>>

  // User management
  getUser(accessToken?: string): Promise<AuthResponse<AuthUser>>
  updateUser(attributes: Partial<AuthUser>): Promise<AuthResponse<AuthUser>>

  // Event listeners
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: AuthSession | null) => void
  ): () => void
}

/**
 * Auth state change events
 */
export type AuthChangeEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

/**
 * Provider configuration
 */
export interface AuthProviderConfig {
  // Common config
  autoRefreshToken?: boolean
  persistSession?: boolean
  storageKey?: string

  // Provider specific
  [key: string]: any
}

/**
 * Factory for creating auth providers
 */
export interface IAuthProviderFactory {
  createProvider(type: 'supabase' | 'mock', config: AuthProviderConfig): IAuthProvider
}
