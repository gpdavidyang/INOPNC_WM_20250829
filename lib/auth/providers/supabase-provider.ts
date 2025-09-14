/**
 * Supabase Auth Provider Implementation
 *
 * Concrete implementation of IAuthProvider using Supabase.
 * Wraps Supabase Auth API with our abstraction layer.
 */

import { SupabaseClient, Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  IAuthProvider,
  AuthUser,
  AuthSession,
  AuthError,
  AuthResponse,
  EmailPasswordCredentials,
  PhonePasswordCredentials,
  OAuthCredentials,
  SignUpData,
  PasswordResetRequest,
  PasswordUpdateRequest,
  AuthChangeEvent,
  AuthProviderConfig,
} from './types'

/**
 * Convert Supabase User to AuthUser
 */
function mapUser(user: User | null): AuthUser | null {
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.user_metadata?.role || user.app_metadata?.role,
    metadata: {
      ...user.user_metadata,
      app: user.app_metadata,
    },
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

/**
 * Convert Supabase Session to AuthSession
 */
function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null

  const user = mapUser(session.user)
  if (!user) return null

  return {
    user,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    expiresIn: session.expires_in,
  }
}

/**
 * Convert Supabase error to AuthError
 */
function mapError(error: any): AuthError {
  return {
    code: error?.code || 'UNKNOWN_ERROR',
    message: error?.message || 'An unknown error occurred',
    status: error?.status,
    details: error,
  }
}

/**
 * Supabase Auth Provider
 */
export class SupabaseAuthProvider implements IAuthProvider {
  private client: SupabaseClient
  private isServerSide: boolean
  private config: AuthProviderConfig

  constructor(config: AuthProviderConfig = {}) {
    this.config = {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'sb-auth-token',
      ...config,
    }

    // Detect if we're on server or client
    this.isServerSide = typeof window === 'undefined'

    // Initialize appropriate client
    if (this.isServerSide) {
      // Server-side client will be created per-request
      this.client = null as any
    } else {
      // Client-side singleton
      this.client = createClient()
    }
  }

  /**
   * Get or create Supabase client for current context
   */
  private async getClient(): Promise<SupabaseClient> {
    if (!this.isServerSide) {
      return this.client
    }

    // Server-side: Return a client-compatible instance
    // Note: Server-side rendering should use createServerSupabaseClient from lib/supabase/server.ts
    return createClient()
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResponse<AuthSession>> {
    try {
      const client = await this.getClient()
      const {
        data: { session },
        error,
      } = await client.auth.getSession()

      if (error) {
        return { error: mapError(error) }
      }

      const authSession = mapSession(session)
      return { data: authSession || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Refresh the session
   */
  async refreshSession(refreshToken?: string): Promise<AuthResponse<AuthSession>> {
    try {
      const client = await this.getClient()

      const {
        data: { session },
        error,
      } = refreshToken
        ? await client.auth.refreshSession({ refresh_token: refreshToken })
        : await client.auth.refreshSession()

      if (error) {
        return { error: mapError(error) }
      }

      const authSession = mapSession(session)
      return { data: authSession || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Set session from tokens
   */
  async setSession(accessToken: string, refreshToken?: string): Promise<AuthResponse<AuthSession>> {
    try {
      const client = await this.getClient()

      const {
        data: { session },
        error,
      } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      })

      if (error) {
        return { error: mapError(error) }
      }

      const authSession = mapSession(session)
      return { data: authSession || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Clear session
   */
  async clearSession(): Promise<void> {
    try {
      const client = await this.getClient()
      await client.auth.signOut()
    } catch (error) {
      console.error('[SupabaseAuthProvider] Error clearing session:', error)
    }
  }

  /**
   * Sign in with email/phone and password
   */
  async signInWithPassword(
    credentials: EmailPasswordCredentials | PhonePasswordCredentials
  ): Promise<AuthResponse<AuthSession>> {
    try {
      const client = await this.getClient()

      const signInData =
        'email' in credentials
          ? { email: credentials.email, password: credentials.password }
          : { phone: credentials.phone, password: credentials.password }

      const {
        data: { session },
        error,
      } = await client.auth.signInWithPassword(signInData)

      if (error) {
        return { error: mapError(error) }
      }

      const authSession = mapSession(session)
      return { data: authSession || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(credentials: OAuthCredentials): Promise<AuthResponse<{ url: string }>> {
    try {
      const client = await this.getClient()

      const { data, error } = await client.auth.signInWithOAuth({
        provider: credentials.provider as any,
        options: {
          redirectTo: credentials.redirectTo,
        },
      })

      if (error) {
        return { error: mapError(error) }
      }

      return { data: { url: data.url || '' } }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Sign in with OTP
   */
  async signInWithOtp(email: string): Promise<AuthResponse<void>> {
    try {
      const client = await this.getClient()

      const { error } = await client.auth.signInWithOtp({ email })

      if (error) {
        return { error: mapError(error) }
      }

      return { data: undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, token: string): Promise<AuthResponse<AuthSession>> {
    try {
      const client = await this.getClient()

      const {
        data: { session },
        error,
      } = await client.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) {
        return { error: mapError(error) }
      }

      const authSession = mapSession(session)
      return { data: authSession || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Sign up new user
   */
  async signUp(data: SignUpData): Promise<AuthResponse<AuthSession>> {
    try {
      const client = await this.getClient()

      const { data: authData, error } = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: data.metadata,
        },
      })

      if (error) {
        return { error: mapError(error) }
      }

      const authSession = mapSession(authData.session)
      return { data: authSession || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResponse<void>> {
    try {
      const client = await this.getClient()
      const { error } = await client.auth.signOut()

      if (error) {
        return { error: mapError(error) }
      }

      return { data: undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Reset password
   */
  async resetPasswordForEmail(request: PasswordResetRequest): Promise<AuthResponse<void>> {
    try {
      const client = await this.getClient()

      const { error } = await client.auth.resetPasswordForEmail(request.email, {
        redirectTo: request.redirectTo,
      })

      if (error) {
        return { error: mapError(error) }
      }

      return { data: undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Update password
   */
  async updatePassword(request: PasswordUpdateRequest): Promise<AuthResponse<AuthUser>> {
    try {
      const client = await this.getClient()

      const {
        data: { user },
        error,
      } = await client.auth.updateUser({
        password: request.newPassword,
      })

      if (error) {
        return { error: mapError(error) }
      }

      const authUser = mapUser(user)
      return { data: authUser || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Get current user
   */
  async getUser(accessToken?: string): Promise<AuthResponse<AuthUser>> {
    try {
      const client = await this.getClient()

      const {
        data: { user },
        error,
      } = await client.auth.getUser(accessToken)

      if (error) {
        return { error: mapError(error) }
      }

      const authUser = mapUser(user)
      return { data: authUser || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Update user attributes
   */
  async updateUser(attributes: Partial<AuthUser>): Promise<AuthResponse<AuthUser>> {
    try {
      const client = await this.getClient()

      const updateData: any = {}

      if (attributes.email) updateData.email = attributes.email
      if (attributes.phone) updateData.phone = attributes.phone
      if (attributes.metadata) updateData.data = attributes.metadata

      const {
        data: { user },
        error,
      } = await client.auth.updateUser(updateData)

      if (error) {
        return { error: mapError(error) }
      }

      const authUser = mapUser(user)
      return { data: authUser || undefined }
    } catch (error) {
      return { error: mapError(error) }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: AuthSession | null) => void
  ): () => void {
    if (this.isServerSide) {
      // No-op on server side
      return () => {}
    }

    const mapEvent = (event: string): AuthChangeEvent => {
      const eventMap: Record<string, AuthChangeEvent> = {
        SIGNED_IN: 'SIGNED_IN',
        SIGNED_OUT: 'SIGNED_OUT',
        TOKEN_REFRESHED: 'TOKEN_REFRESHED',
        USER_UPDATED: 'USER_UPDATED',
        PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
      }
      return eventMap[event] || 'SIGNED_OUT'
    }

    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange((event, session) => {
      const authEvent = mapEvent(event)
      const authSession = mapSession(session)
      callback(authEvent, authSession)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }
}

/**
 * Export singleton instance for client-side use
 */
export const supabaseAuthProvider = new SupabaseAuthProvider()
