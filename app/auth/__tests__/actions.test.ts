/**
 * Tests for Authentication Server Actions
 * 
 * Critical tests for /app/auth/actions.ts focusing on signIn, signUp, and signOut
 * server actions with comprehensive form validation, error handling, and security.
 * These are protected files requiring explicit testing for auth security.
 */

import { signIn, signUp, signOut } from '../actions'
import {
  createMockSupabaseClient,
  createMockUser,
  createMockSession,
  createMockAuthResponse,
  createMockAuthError,
  type MockSupabaseClient
} from '@/lib/test-utils'

// Mock the server client
let mockSupabaseClient: any
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock ProfileManager if it's used
jest.mock('@/lib/auth/profile-manager', () => ({
  ProfileManager: {
    updateLoginStats: jest.fn(),
    logAuthEvent: jest.fn()
  }
}))

// Mock console methods to capture logging
let consoleErrorSpy: jest.SpyInstance

describe('Authentication Server Actions', () => {
  beforeEach(() => {
    // Create comprehensive mock client for server actions
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    }
    
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const email = 'worker@inopnc.com'
      const password = 'password123'
      const user = createMockUser({ email })
      const session = createMockSession(user)

      // Mock successful sign in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ user, session })
      )

      // Mock profile query and update
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { login_count: 5 },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await signIn(email, password)

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password
      })
      expect(result).toEqual({ success: true })
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should return error for invalid credentials', async () => {
      const email = 'invalid@example.com'
      const password = 'wrongpassword'
      const authError = createMockAuthError('Invalid login credentials', 400)

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ error: authError })
      )

      const result = await signIn(email, password)

      expect(result).toEqual({ error: 'Invalid login credentials' })
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password
      })
    })

    it('should update login statistics on successful login', async () => {
      const email = 'manager@inopnc.com'
      const password = 'password123'
      const user = createMockUser({ email })
      const session = createMockSession(user)

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ user, session })
      )

      // Mock profile queries with chainable methods
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { login_count: 10 },
            error: null
          })
        })
      })

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await signIn(email, password)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSelect).toHaveBeenCalledWith('login_count')
      expect(mockUpdate).toHaveBeenCalledWith({
        last_login_at: expect.any(String),
        login_count: 11
      })
    })

    it('should handle login stat update failures gracefully', async () => {
      const email = 'user@example.com'
      const password = 'password123'
      const user = createMockUser({ email })
      const session = createMockSession(user)

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ user, session })
      )

      // Mock profile query to throw an error
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database connection lost'))
          })
        })
      })

      const result = await signIn(email, password)

      // Should still succeed even if login stats update fails
      expect(result).toEqual({ success: true })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update login stats:',
        expect.any(Error)
      )
    })

    it('should handle missing profile gracefully', async () => {
      const email = 'newuser@example.com'
      const password = 'password123'
      const user = createMockUser({ email })
      const session = createMockSession(user)

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ user, session })
      )

      // Mock profile query returning null (profile doesn't exist)
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })

      const result = await signIn(email, password)

      // Should still succeed even if profile doesn't exist
      expect(result).toEqual({ success: true })
    })

    it('should validate input parameters', async () => {
      // Test empty email
      const authError = createMockAuthError('Invalid email', 400)
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ error: authError })
      )

      const result = await signIn('', 'password123')
      expect(result).toEqual({ error: 'Invalid email' })

      // Test empty password
      jest.clearAllMocks()
      const result2 = await signIn('test@example.com', '')
      expect(result2).toEqual({ error: 'Invalid email' })
    })
  })

  describe('signUp', () => {
    it('should sign up successfully with valid data', async () => {
      const email = 'newworker@inopnc.com'
      const password = 'newpassword123'
      const fullName = 'New Worker'
      const phone = '010-1234-5678'
      const role = 'worker'
      const user = createMockUser({ 
        email,
        user_metadata: { full_name: fullName, phone, role }
      })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      // Mock successful profile operations
      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      const result = await signUp(email, password, fullName, phone, role)

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role
          }
        }
      })

      expect(result).toEqual({ success: true })
      expect(mockUpsert).toHaveBeenCalledTimes(3) // profiles, user_organizations, site_assignments
    })

    it('should return error for invalid signup data', async () => {
      const authError = createMockAuthError('User already registered', 422)
      
      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ error: authError })
      )

      const result = await signUp(
        'existing@example.com',
        'password123',
        'Existing User',
        '010-1234-5678',
        'worker'
      )

      expect(result).toEqual({ error: 'User already registered' })
    })

    it('should handle INOPNC email domain organization assignment', async () => {
      const email = 'admin@inopnc.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp(email, 'password123', 'Admin User', '010-1234-5678', 'admin')

      // Check profile creation with INOPNC organization
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: '11111111-1111-1111-1111-111111111111',
          site_id: null // admin doesn't get site assignment
        })
      )
    })

    it('should handle customer email domain organization assignment', async () => {
      const email = 'manager@customer.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp(email, 'password123', 'Customer Manager', '010-1234-5678', 'customer_manager')

      // Check profile creation with customer organization
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: '22222222-2222-2222-2222-222222222222',
          site_id: null // customer manager doesn't get site assignment
        })
      )
    })

    it('should handle worker/site_manager site assignment', async () => {
      const email = 'worker@inopnc.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp(email, 'password123', 'Site Worker', '010-1234-5678', 'worker')

      // Check profile creation with site assignment
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: '11111111-1111-1111-1111-111111111111',
          site_id: '33333333-3333-3333-3333-333333333333'
        })
      )
    })

    it('should handle special case for davidswyang@gmail.com', async () => {
      const email = 'davidswyang@gmail.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp(email, 'password123', 'David Yang', '010-1234-5678', 'worker')

      // Check profile creation with system_admin role override
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'system_admin',
          organization_id: '11111111-1111-1111-1111-111111111111'
        })
      )
    })

    it('should handle profile creation errors', async () => {
      const email = 'test@example.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      // Mock profile creation failure
      const profileError = createMockAuthError('Database error', 500)
      mockSupabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          data: null,
          error: profileError
        })
      })

      const result = await signUp(email, 'password123', 'Test User', '010-1234-5678', 'worker')

      expect(result).toEqual({ error: 'Failed to create user profile' })
      expect(consoleErrorSpy).toHaveBeenCalledWith('Profile creation error:', profileError)
    })

    it('should handle organization assignment for unknown domain', async () => {
      const email = 'user@unknown.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp(email, 'password123', 'Unknown User', '010-1234-5678', 'worker')

      // Check profile creation with no organization
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: null,
          site_id: null
        })
      )

      // Should only be called once (profiles table only)
      expect(mockUpsert).toHaveBeenCalledTimes(1)
    })

    it('should create user_organizations and site_assignments entries', async () => {
      const email = 'worker@inopnc.com'
      const user = createMockUser({ email })

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp(email, 'password123', 'Worker User', '010-1234-5678', 'worker')

      // Should create 3 entries: profiles, user_organizations, site_assignments
      expect(mockUpsert).toHaveBeenCalledTimes(3)
      
      // Check user_organizations entry
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: user.id,
        organization_id: '11111111-1111-1111-1111-111111111111',
        is_primary: true
      })

      // Check site_assignments entry
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: user.id,
        site_id: '33333333-3333-3333-3333-333333333333',
        assigned_date: expect.any(String),
        is_active: true
      })
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const user = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue(
        createMockAuthResponse({ user })
      )
      mockSupabaseClient.auth.signOut.mockResolvedValue(
        createMockAuthResponse({})
      )

      const result = await signOut()

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should handle signOut errors', async () => {
      const user = createMockUser()
      const signOutError = createMockAuthError('Failed to sign out', 500)

      mockSupabaseClient.auth.getUser.mockResolvedValue(
        createMockAuthResponse({ user })
      )
      mockSupabaseClient.auth.signOut.mockResolvedValue(
        createMockAuthResponse({ error: signOutError })
      )

      const result = await signOut()

      expect(result).toEqual({ error: 'Failed to sign out' })
    })

    it('should handle signOut when no user is logged in', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        createMockAuthResponse({ user: null })
      )
      mockSupabaseClient.auth.signOut.mockResolvedValue(
        createMockAuthResponse({})
      )

      const result = await signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should handle getUser errors during signOut', async () => {
      const getUserError = createMockAuthError('Invalid session', 401)

      mockSupabaseClient.auth.getUser.mockResolvedValue(
        createMockAuthResponse({ error: getUserError })
      )
      mockSupabaseClient.auth.signOut.mockResolvedValue(
        createMockAuthResponse({})
      )

      const result = await signOut()

      // Should still attempt to sign out even if getUser fails
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })
  })

  describe('input validation and security', () => {
    it('should handle SQL injection attempts in email', async () => {
      const maliciousEmail = "'; DROP TABLE users; --"
      const authError = createMockAuthError('Invalid email format', 400)

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ error: authError })
      )

      const result = await signIn(maliciousEmail, 'password123')
      expect(result).toEqual({ error: 'Invalid email format' })
    })

    it('should handle XSS attempts in user data', async () => {
      const xssName = '<script>alert("xss")</script>'
      const xssPhone = '<img src=x onerror=alert("xss")>'
      const user = createMockUser()

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      await signUp('test@example.com', 'password123', xssName, xssPhone, 'worker')

      // Data should be stored as-is (Supabase handles sanitization)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: xssName,
          phone: xssPhone
        })
      )
    })

    it('should handle very long input strings', async () => {
      const longEmail = 'x'.repeat(1000) + '@example.com'
      const longPassword = 'p'.repeat(1000)
      const authError = createMockAuthError('Email too long', 400)

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ error: authError })
      )

      const result = await signIn(longEmail, longPassword)
      expect(result).toEqual({ error: 'Email too long' })
    })

    it('should handle special characters in phone numbers', async () => {
      const specialPhone = '+82-010-1234-5678 (ext. 123)'
      const user = createMockUser()

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert })

      const result = await signUp(
        'test@example.com',
        'password123',
        'Test User',
        specialPhone,
        'worker'
      )

      expect(result).toEqual({ success: true })
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: specialPhone
        })
      )
    })
  })

  describe('error resilience and recovery', () => {
    it('should handle Supabase client creation failures', async () => {
      // Mock createClient to throw error
      const { createClient } = require('@/lib/supabase/server')
      createClient.mockImplementationOnce(() => {
        throw new Error('Supabase client creation failed')
      })

      // Should throw error since server actions can't gracefully handle this
      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        'Supabase client creation failed'
      )
    })

    it('should handle network timeouts during authentication', async () => {
      const timeoutError = createMockAuthError('Network timeout', 0)
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ error: timeoutError })
      )

      const result = await signIn('test@example.com', 'password123')
      expect(result).toEqual({ error: 'Network timeout' })
    })

    it('should handle database connection failures during profile updates', async () => {
      const user = createMockUser()
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ user })
      )

      // Mock database connection failure
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost')
      })

      const result = await signIn('test@example.com', 'password123')

      // Should still succeed (login worked) but log the error
      expect(result).toEqual({ success: true })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update login stats:',
        expect.any(Error)
      )
    })
  })
})