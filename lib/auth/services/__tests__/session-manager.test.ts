/**
 * SessionManager Unit Tests
 */

import { SessionManager } from '../session-manager'
import { Session } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
}

describe('SessionManager', () => {
  let sessionManager: SessionManager

  beforeEach(() => {
    // Reset singleton instance
    ;(SessionManager as any).instance = null
    sessionManager = SessionManager.getInstance()
    sessionManager.setSupabaseClient(mockSupabaseClient as any)

    // Clear all mocks
    jest.clearAllMocks()

    // Reset cache
    ;(sessionManager as any).sessionCache = null
    ;(sessionManager as any).cacheExpiry = 0
    ;(sessionManager as any).profileCache.clear()
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = SessionManager.getInstance()
      const instance2 = SessionManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('getSession', () => {
    const mockSession: Session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    } as Session

    it('should fetch and return a valid session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const session = await sessionManager.getSession()

      expect(session).toEqual(mockSession)
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should return null for invalid session', async () => {
      const invalidSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: invalidSession },
        error: null,
      })

      const session = await sessionManager.getSession()

      expect(session).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Network error'),
      })

      const session = await sessionManager.getSession()

      expect(session).toBeNull()
    })
  })

  describe('refreshSession', () => {
    const mockSession: Session = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    } as Session

    it('should refresh and return new session', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const session = await sessionManager.refreshSession()

      expect(session).toEqual(mockSession)
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledTimes(1)
    })

    it('should clear session on refresh error', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Refresh failed'),
      })
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      const session = await sessionManager.refreshSession()

      expect(session).toBeNull()
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('clearSession', () => {
    it('should clear session and cache', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      // Set some cache data first
      ;(sessionManager as any).sessionCache = {} as Session
      ;(sessionManager as any).cacheExpiry = Date.now() + 10000
      ;(sessionManager as any).profileCache.set('user-123', {
        data: { id: 'user-123' },
        expiry: Date.now() + 10000,
      })

      await sessionManager.clearSession()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()

      // Check cache is cleared
      const stats = sessionManager.getCacheStats()
      expect(stats.sessionCached).toBe(false)
      expect(stats.profilesCached).toBe(0)
    })
  })

  describe('validateSession', () => {
    it('should validate a valid session', () => {
      const validSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        user: { id: 'user-123' },
      } as Session

      const isValid = sessionManager.validateSession(validSession)

      expect(isValid).toBe(true)
    })

    it('should invalidate expired session', () => {
      const expiredSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        user: { id: 'user-123' },
      } as Session

      const isValid = sessionManager.validateSession(expiredSession)

      expect(isValid).toBe(false)
    })

    it('should invalidate session with missing data', () => {
      const invalidSession = {
        access_token: 'token',
        // Missing user
      } as any

      const isValid = sessionManager.validateSession(invalidSession)

      expect(isValid).toBe(false)
    })
  })

  describe('getUserProfile', () => {
    const mockProfile = {
      id: 'user-123',
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    }

    beforeEach(() => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      })
    })

    it('should fetch and cache user profile', async () => {
      const profile = await sessionManager.getUserProfile('user-123')

      expect(profile).toEqual(mockProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')

      // Second call should use cache
      const cachedProfile = await sessionManager.getUserProfile('user-123')
      expect(cachedProfile).toEqual(mockProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1) // Not called again
    })

    it('should handle profile fetch errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Profile not found'),
            }),
          }),
        }),
      })

      const profile = await sessionManager.getUserProfile('user-456')

      expect(profile).toBeNull()
    })
  })

  describe('Cache Management', () => {
    it('should clear user cache', () => {
      // Add to cache
      ;(sessionManager as any).profileCache.set('user-123', {
        data: { id: 'user-123' },
        expiry: Date.now() + 10000,
      })

      expect(sessionManager.getCacheStats().profilesCached).toBe(1)

      sessionManager.clearUserCache('user-123')

      expect(sessionManager.getCacheStats().profilesCached).toBe(0)
    })

    it('should provide accurate cache statistics', () => {
      // Set session cache
      ;(sessionManager as any).sessionCache = {} as Session
      ;(sessionManager as any).cacheExpiry = Date.now() + 10000

      // Set profile cache
      ;(sessionManager as any).profileCache.set('user-123', {
        data: { id: 'user-123' },
        expiry: Date.now() + 10000,
      })

      const stats = sessionManager.getCacheStats()

      expect(stats.sessionCached).toBe(true)
      expect(stats.sessionExpiry).toBeInstanceOf(Date)
      expect(stats.profilesCached).toBe(1)
    })
  })
})
