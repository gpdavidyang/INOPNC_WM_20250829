/**
 * MockAuthProvider Unit Tests
 */

import { MockAuthProvider } from '../mock-provider'
import { AuthChangeEvent, AuthSession } from '../types'

describe('MockAuthProvider', () => {
  let provider: MockAuthProvider

  beforeEach(() => {
    provider = new MockAuthProvider({ mockDelay: false })
  })

  afterEach(() => {
    provider.reset()
  })

  describe('Sign In', () => {
    it('should sign in with valid email and password', async () => {
      const result = await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe('admin@test.com')
      expect(result.data?.user.role).toBe('system_admin')
      expect(result.data?.accessToken).toContain('mock-access-token')
    })

    it('should fail with invalid password', async () => {
      const result = await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'wrong',
      })

      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('INVALID_PASSWORD')
    })

    it('should fail with non-existent user', async () => {
      const result = await provider.signInWithPassword({
        email: 'nobody@test.com',
        password: 'test123',
      })

      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('USER_NOT_FOUND')
    })

    it('should sign in with phone and password', async () => {
      // Add a user with phone
      provider.addTestUser({
        id: 'phone-user',
        phone: '+1234567890',
        password: 'phone123',
        role: 'worker',
      })

      const result = await provider.signInWithPassword({
        phone: '+1234567890',
        password: 'phone123',
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.user.phone).toBe('+1234567890')
    })
  })

  describe('Sign Up', () => {
    it('should create new user', async () => {
      const result = await provider.signUp({
        email: 'newuser@test.com',
        password: 'newpass123',
        metadata: {
          full_name: 'New User',
          role: 'worker',
        },
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe('newuser@test.com')
      expect(result.data?.user.metadata?.full_name).toBe('New User')
    })

    it('should fail if user already exists', async () => {
      const result = await provider.signUp({
        email: 'admin@test.com',
        password: 'test123',
      })

      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('USER_EXISTS')
    })
  })

  describe('Session Management', () => {
    it('should get current session after sign in', async () => {
      await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      const result = await provider.getSession()

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe('admin@test.com')
    })

    it('should return no session when not signed in', async () => {
      const result = await provider.getSession()

      expect(result.error).toBeUndefined()
      expect(result.data).toBeUndefined()
    })

    it('should refresh session', async () => {
      const signInResult = await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      const oldToken = signInResult.data?.accessToken

      const refreshResult = await provider.refreshSession()

      expect(refreshResult.error).toBeUndefined()
      expect(refreshResult.data).toBeDefined()
      expect(refreshResult.data?.accessToken).not.toBe(oldToken)
      expect(refreshResult.data?.user.email).toBe('admin@test.com')
    })

    it('should set session from token', async () => {
      const signInResult = await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      await provider.clearSession()

      const setResult = await provider.setSession(
        signInResult.data!.accessToken,
        signInResult.data!.refreshToken
      )

      expect(setResult.error).toBeUndefined()
      expect(setResult.data).toBeDefined()
      expect(setResult.data?.user.email).toBe('admin@test.com')
    })

    it('should clear session on sign out', async () => {
      await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      await provider.signOut()

      const result = await provider.getSession()
      expect(result.data).toBeUndefined()
    })
  })

  describe('OTP Authentication', () => {
    it('should send OTP', async () => {
      const result = await provider.signInWithOtp('admin@test.com')

      expect(result.error).toBeUndefined()
      expect(result.data).toBeUndefined()
    })

    it('should verify OTP', async () => {
      await provider.signInWithOtp('admin@test.com')

      const result = await provider.verifyOtp('admin@test.com', '123456')

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe('admin@test.com')
    })

    it('should fail with wrong OTP', async () => {
      await provider.signInWithOtp('admin@test.com')

      const result = await provider.verifyOtp('admin@test.com', '999999')

      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('INVALID_OTP')
    })
  })

  describe('User Management', () => {
    beforeEach(async () => {
      await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })
    })

    it('should get current user', async () => {
      const result = await provider.getUser()

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.email).toBe('admin@test.com')
    })

    it('should update user attributes', async () => {
      const result = await provider.updateUser({
        metadata: {
          full_name: 'Updated Admin',
        },
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.metadata?.full_name).toBe('Updated Admin')
    })

    it('should update password', async () => {
      const result = await provider.updatePassword({
        newPassword: 'newpass456',
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()

      // Sign out and sign in with new password
      await provider.signOut()

      const signInResult = await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'newpass456',
      })

      expect(signInResult.error).toBeUndefined()
      expect(signInResult.data).toBeDefined()
    })
  })

  describe('OAuth', () => {
    it('should return OAuth URL', async () => {
      const result = await provider.signInWithOAuth({
        provider: 'google',
        redirectTo: 'http://localhost:3000/auth/callback',
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.url).toContain('mock-oauth.com/google')
      expect(result.data?.url).toContain('redirect=http%3A%2F%2Flocalhost%3A3000')
    })
  })

  describe('Auth State Changes', () => {
    it('should emit auth state changes', async () => {
      const events: { event: AuthChangeEvent; session: AuthSession | null }[] = []

      const unsubscribe = provider.onAuthStateChange((event, session) => {
        events.push({ event, session })
      })

      // Sign in
      await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(events).toHaveLength(1)
      expect(events[0].event).toBe('SIGNED_IN')
      expect(events[0].session?.user.email).toBe('admin@test.com')

      // Sign out
      await provider.signOut()

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(events).toHaveLength(2)
      expect(events[1].event).toBe('SIGNED_OUT')
      expect(events[1].session).toBeNull()

      unsubscribe()
    })

    it('should unsubscribe from auth state changes', async () => {
      const events: AuthChangeEvent[] = []

      const unsubscribe = provider.onAuthStateChange(event => {
        events.push(event)
      })

      await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      await new Promise(resolve => setTimeout(resolve, 10))
      expect(events).toHaveLength(1)

      // Unsubscribe
      unsubscribe()

      // This should not trigger event
      await provider.signOut()

      await new Promise(resolve => setTimeout(resolve, 10))
      expect(events).toHaveLength(1) // Still only 1 event
    })
  })

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      const result = await provider.resetPasswordForEmail({
        email: 'admin@test.com',
        redirectTo: 'http://localhost:3000/reset-password',
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeUndefined()
    })

    it('should not reveal if user does not exist', async () => {
      const result = await provider.resetPasswordForEmail({
        email: 'nobody@test.com',
      })

      // Should succeed even if user doesn't exist (security)
      expect(result.error).toBeUndefined()
      expect(result.data).toBeUndefined()
    })
  })

  describe('Test Helpers', () => {
    it('should get all users', () => {
      const users = provider.getAllUsers()

      expect(users.length).toBeGreaterThan(0)
      expect(users.some(u => u.email === 'admin@test.com')).toBe(true)
      expect(users.some(u => u.email === 'manager@test.com')).toBe(true)
      expect(users.some(u => u.email === 'worker@test.com')).toBe(true)
    })

    it('should add test user', () => {
      provider.addTestUser({
        email: 'custom@test.com',
        password: 'custom123',
        role: 'custom_role',
      })

      const users = provider.getAllUsers()
      expect(users.some(u => u.email === 'custom@test.com')).toBe(true)
    })

    it('should reset provider state', async () => {
      // Sign in and add custom user
      await provider.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      })

      provider.addTestUser({
        email: 'temp@test.com',
        password: 'temp123',
      })

      // Reset
      provider.reset()

      // Check session is cleared
      const session = await provider.getSession()
      expect(session.data).toBeUndefined()

      // Check custom user is removed but default users remain
      const users = provider.getAllUsers()
      expect(users.some(u => u.email === 'temp@test.com')).toBe(false)
      expect(users.some(u => u.email === 'admin@test.com')).toBe(true)
    })
  })
})
