/**
 * Mock Auth Provider for Testing
 *
 * Provides a mock implementation of IAuthProvider for testing.
 * Simulates authentication without external dependencies.
 */

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
 * Mock user database
 */
interface MockUserRecord {
  id: string
  email?: string
  phone?: string
  password: string
  role: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

/**
 * Mock Auth Provider
 */
export class MockAuthProvider implements IAuthProvider {
  private users: Map<string, MockUserRecord> = new Map()
  private sessions: Map<string, AuthSession> = new Map()
  private currentSession: AuthSession | null = null
  private listeners: Set<(event: AuthChangeEvent, session: AuthSession | null) => void> = new Set()
  private config: AuthProviderConfig

  constructor(config: AuthProviderConfig = {}) {
    this.config = {
      autoRefreshToken: true,
      persistSession: true,
      ...config,
    }

    // Initialize with test users
    this.initializeTestUsers()
  }

  /**
   * Initialize test users
   */
  private initializeTestUsers(): void {
    const testUsers: MockUserRecord[] = [
      {
        id: 'admin-123',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'system_admin',
        metadata: { full_name: 'Test Admin' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'manager-456',
        email: 'manager@test.com',
        password: 'manager123',
        role: 'site_manager',
        metadata: { full_name: 'Test Manager' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'worker-789',
        email: 'worker@test.com',
        password: 'worker123',
        role: 'worker',
        metadata: { full_name: 'Test Worker' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    testUsers.forEach(user => {
      this.users.set(user.email!, user)
      if (user.phone) {
        this.users.set(user.phone, user)
      }
    })
  }

  /**
   * Generate mock tokens
   */
  private generateTokens(): { accessToken: string; refreshToken: string } {
    const timestamp = Date.now()
    return {
      accessToken: `mock-access-token-${timestamp}`,
      refreshToken: `mock-refresh-token-${timestamp}`,
    }
  }

  /**
   * Create session from user
   */
  private createSession(user: MockUserRecord): AuthSession {
    const { accessToken, refreshToken } = this.generateTokens()
    const session: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        metadata: user.metadata,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      expiresIn: 3600,
    }

    this.sessions.set(accessToken, session)
    return session
  }

  /**
   * Emit auth state change
   */
  private emitAuthStateChange(event: AuthChangeEvent, session: AuthSession | null): void {
    this.listeners.forEach(callback => {
      setTimeout(() => callback(event, session), 0)
    })
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResponse<AuthSession>> {
    await this.simulateDelay()

    if (!this.currentSession) {
      return { data: undefined }
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    if (this.currentSession.expiresAt && this.currentSession.expiresAt < now) {
      this.currentSession = null
      return { data: undefined }
    }

    return { data: this.currentSession }
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken?: string): Promise<AuthResponse<AuthSession>> {
    await this.simulateDelay()

    if (!this.currentSession && !refreshToken) {
      return {
        error: {
          code: 'NO_SESSION',
          message: 'No session to refresh',
        },
      }
    }

    // Find session by refresh token or use current
    let session = this.currentSession
    if (refreshToken) {
      session =
        Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken) || null
    }

    if (!session) {
      return {
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      }
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens()
    const newSession: AuthSession = {
      ...session,
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      expiresIn: 3600,
    }

    // Update session storage
    this.sessions.delete(session.accessToken)
    this.sessions.set(accessToken, newSession)
    this.currentSession = newSession

    this.emitAuthStateChange('TOKEN_REFRESHED', newSession)
    return { data: newSession }
  }

  /**
   * Set session from tokens
   */
  async setSession(accessToken: string, refreshToken?: string): Promise<AuthResponse<AuthSession>> {
    await this.simulateDelay()

    const session = this.sessions.get(accessToken)
    if (!session) {
      return {
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'Invalid access token',
        },
      }
    }

    this.currentSession = session
    this.emitAuthStateChange('SIGNED_IN', session)
    return { data: session }
  }

  /**
   * Clear session
   */
  async clearSession(): Promise<void> {
    await this.simulateDelay()

    if (this.currentSession) {
      this.sessions.delete(this.currentSession.accessToken)
    }

    this.currentSession = null
    this.emitAuthStateChange('SIGNED_OUT', null)
  }

  /**
   * Sign in with password
   */
  async signInWithPassword(
    credentials: EmailPasswordCredentials | PhonePasswordCredentials
  ): Promise<AuthResponse<AuthSession>> {
    await this.simulateDelay()

    const identifier = 'email' in credentials ? credentials.email : credentials.phone
    const user = this.users.get(identifier)

    if (!user) {
      return {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }
    }

    if (user.password !== credentials.password) {
      return {
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password',
        },
      }
    }

    const session = this.createSession(user)
    this.currentSession = session

    this.emitAuthStateChange('SIGNED_IN', session)
    return { data: session }
  }

  /**
   * Sign in with OAuth
   */
  async signInWithOAuth(credentials: OAuthCredentials): Promise<AuthResponse<{ url: string }>> {
    await this.simulateDelay()

    // Return mock OAuth URL
    const url = `https://mock-oauth.com/${credentials.provider}?redirect=${encodeURIComponent(
      credentials.redirectTo || 'http://localhost:3000'
    )}`

    return { data: { url } }
  }

  /**
   * Sign in with OTP
   */
  async signInWithOtp(email: string): Promise<AuthResponse<void>> {
    await this.simulateDelay()

    const user = this.users.get(email)
    if (!user) {
      return {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }
    }

    // In real implementation, would send OTP email
    console.log(`[MockAuth] OTP sent to ${email}: 123456`)
    return { data: undefined }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, token: string): Promise<AuthResponse<AuthSession>> {
    await this.simulateDelay()

    // Mock OTP is always '123456'
    if (token !== '123456') {
      return {
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP',
        },
      }
    }

    const user = this.users.get(email)
    if (!user) {
      return {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }
    }

    const session = this.createSession(user)
    this.currentSession = session

    this.emitAuthStateChange('SIGNED_IN', session)
    return { data: session }
  }

  /**
   * Sign up
   */
  async signUp(data: SignUpData): Promise<AuthResponse<AuthSession>> {
    await this.simulateDelay()

    if (this.users.has(data.email)) {
      return {
        error: {
          code: 'USER_EXISTS',
          message: 'User already exists',
        },
      }
    }

    const user: MockUserRecord = {
      id: `user-${Date.now()}`,
      email: data.email,
      password: data.password,
      role: data.metadata?.role || 'worker',
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.users.set(data.email, user)

    const session = this.createSession(user)
    this.currentSession = session

    this.emitAuthStateChange('SIGNED_IN', session)
    return { data: session }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResponse<void>> {
    await this.simulateDelay()

    await this.clearSession()
    return { data: undefined }
  }

  /**
   * Reset password
   */
  async resetPasswordForEmail(request: PasswordResetRequest): Promise<AuthResponse<void>> {
    await this.simulateDelay()

    const user = this.users.get(request.email)
    if (!user) {
      // Don't reveal if user exists
      return { data: undefined }
    }

    console.log(`[MockAuth] Password reset link sent to ${request.email}`)
    return { data: undefined }
  }

  /**
   * Update password
   */
  async updatePassword(request: PasswordUpdateRequest): Promise<AuthResponse<AuthUser>> {
    await this.simulateDelay()

    if (!this.currentSession) {
      return {
        error: {
          code: 'NO_SESSION',
          message: 'No active session',
        },
      }
    }

    const user = Array.from(this.users.values()).find(u => u.id === this.currentSession!.user.id)
    if (!user) {
      return {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }
    }

    user.password = request.newPassword
    user.updatedAt = new Date().toISOString()

    return {
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        metadata: user.metadata,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  }

  /**
   * Get user
   */
  async getUser(accessToken?: string): Promise<AuthResponse<AuthUser>> {
    await this.simulateDelay()

    const token = accessToken || this.currentSession?.accessToken
    if (!token) {
      return {
        error: {
          code: 'NO_SESSION',
          message: 'No active session',
        },
      }
    }

    const session = this.sessions.get(token)
    if (!session) {
      return {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
      }
    }

    return { data: session.user }
  }

  /**
   * Update user
   */
  async updateUser(attributes: Partial<AuthUser>): Promise<AuthResponse<AuthUser>> {
    await this.simulateDelay()

    if (!this.currentSession) {
      return {
        error: {
          code: 'NO_SESSION',
          message: 'No active session',
        },
      }
    }

    const user = Array.from(this.users.values()).find(u => u.id === this.currentSession!.user.id)
    if (!user) {
      return {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }
    }

    // Update user record
    if (attributes.email) user.email = attributes.email
    if (attributes.phone) user.phone = attributes.phone
    if (attributes.metadata) user.metadata = { ...user.metadata, ...attributes.metadata }
    user.updatedAt = new Date().toISOString()

    // Update session
    this.currentSession.user = {
      ...this.currentSession.user,
      ...attributes,
      updatedAt: user.updatedAt,
    }

    this.emitAuthStateChange('USER_UPDATED', this.currentSession)

    return { data: this.currentSession.user }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: AuthSession | null) => void
  ): () => void {
    this.listeners.add(callback)

    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(): Promise<void> {
    if (this.config.mockDelay !== false) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  /**
   * Test helper: Get all users
   */
  getAllUsers(): MockUserRecord[] {
    return Array.from(this.users.values())
  }

  /**
   * Test helper: Add test user
   */
  addTestUser(user: Partial<MockUserRecord>): void {
    const fullUser: MockUserRecord = {
      id: user.id || `user-${Date.now()}`,
      email: user.email,
      phone: user.phone,
      password: user.password || 'test123',
      role: user.role || 'worker',
      metadata: user.metadata || {},
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
    }

    if (fullUser.email) this.users.set(fullUser.email, fullUser)
    if (fullUser.phone) this.users.set(fullUser.phone, fullUser)
  }

  /**
   * Test helper: Clear all data
   */
  reset(): void {
    this.users.clear()
    this.sessions.clear()
    this.currentSession = null
    this.listeners.clear()
    this.initializeTestUsers()
  }
}
