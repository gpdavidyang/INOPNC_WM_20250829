/**
 * Auth Providers Export
 *
 * Central export point for all auth provider implementations.
 */

// Types
export type {
  IAuthProvider,
  IAuthProviderFactory,
  AuthUser,
  AuthSession,
  AuthError,
  AuthResponse,
  EmailPasswordCredentials,
  PhonePasswordCredentials,
  OAuthCredentials,
  SignInCredentials,
  SignUpData,
  PasswordResetRequest,
  PasswordUpdateRequest,
  AuthChangeEvent,
  AuthProviderConfig,
} from './types'

// Providers
export { SupabaseAuthProvider, supabaseAuthProvider } from './supabase-provider'
export { MockAuthProvider } from './mock-provider'

// Factory
export { AuthProviderFactory, authProviderFactory, getAuthProvider } from './factory'
