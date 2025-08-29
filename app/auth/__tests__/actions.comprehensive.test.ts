/**
 * Comprehensive Unit Tests for Authentication Actions
 */

import { signIn, signUp, signOut } from '../actions'
import { createClient } from '@/lib/supabase/server'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Authentication Actions', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnThis(),
      })),
      rpc: jest.fn(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { login_count: 5 }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })
      
      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await signIn('test@example.com', 'Test123!@#')

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Test123!@#',
      })
      expect(result).toEqual({ success: true })
    })

    it('should return error for invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      const result = await signIn('test@example.com', 'wrongpassword')

      expect(result).toEqual({ error: 'Invalid login credentials' })
    })

    it('should update login stats on successful login', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { login_count: 5 }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })
      
      const fromMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }
      
      mockSupabaseClient.from.mockReturnValue(fromMock)

      await signIn('test@example.com', 'Test123!@#')

      expect(fromMock.update).toHaveBeenCalledWith({
        last_login_at: expect.any(String),
        login_count: 6,
      })
    })

    it('should handle profile update errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })
      
      mockSupabaseClient.from().single.mockRejectedValue(new Error('DB Error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await signIn('test@example.com', 'Test123!@#')

      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update login stats:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('signUp', () => {
    it('should successfully create a new account', async () => {
      const mockUser = { id: 'user-456', email: 'newuser@example.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      const result = await signUp(
        'newuser@example.com',
        'Test123!@#',
        'New User',
        '123-456-7890',
        'worker'
      )

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Test123!@#',
        options: {
          data: {
            full_name: 'New User',
            phone: '123-456-7890',
            role: 'worker',
          },
        },
      })
      
      expect(result).toEqual({ success: true })
    })

    it('should assign INOPNC organization for @inopnc.com emails', async () => {
      const mockUser = { id: 'user-789', email: 'employee@inopnc.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      await signUp(
        'employee@inopnc.com',
        'Test123!@#',
        'Employee',
        '123-456-7890',
        'worker'
      )

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: '11111111-1111-1111-1111-111111111111',
          site_id: '33333333-3333-3333-3333-333333333333',
        })
      )
    })

    it('should assign Customer organization for @customer.com emails', async () => {
      const mockUser = { id: 'user-999', email: 'client@customer.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      await signUp(
        'client@customer.com',
        'Test123!@#',
        'Client User',
        '123-456-7890',
        'customer_manager'
      )

      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: '22222222-2222-2222-2222-222222222222',
          site_id: null,
        })
      )
    })

    it('should set system_admin role for davidswyang@gmail.com', async () => {
      const mockUser = { id: 'user-admin', email: 'davidswyang@gmail.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      await signUp(
        'davidswyang@gmail.com',
        'Test123!@#',
        'David Yang',
        '123-456-7890',
        'worker' // This should be overridden
      )

      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'system_admin',
          organization_id: '11111111-1111-1111-1111-111111111111',
        })
      )
    })

    it('should handle signup errors', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      })

      const result = await signUp(
        'existing@example.com',
        'Test123!@#',
        'Existing User',
        '123-456-7890',
        'worker'
      )

      expect(result).toEqual({ error: 'User already registered' })
    })

    it('should handle profile creation errors', async () => {
      const mockUser = { id: 'user-error', email: 'error@example.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })
      
      mockSupabaseClient.from().upsert.mockResolvedValue({
        error: { message: 'Profile creation failed' },
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await signUp(
        'error@example.com',
        'Test123!@#',
        'Error User',
        '123-456-7890',
        'worker'
      )

      expect(result).toEqual({ error: 'Failed to create user profile' })
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should create user_organizations entry when organization is assigned', async () => {
      const mockUser = { id: 'user-org', email: 'org@inopnc.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      await signUp(
        'org@inopnc.com',
        'Test123!@#',
        'Org User',
        '123-456-7890',
        'admin'
      )

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_organizations')
      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-org',
          organization_id: '11111111-1111-1111-1111-111111111111',
          is_primary: true,
        })
      )
    })

    it('should create site_assignments entry for workers and site managers', async () => {
      const mockUser = { id: 'user-site', email: 'site@inopnc.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      await signUp(
        'site@inopnc.com',
        'Test123!@#',
        'Site Worker',
        '123-456-7890',
        'site_manager'
      )

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('site_assignments')
      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-site',
          site_id: '33333333-3333-3333-3333-333333333333',
          assigned_date: expect.any(String),
          is_active: true,
        })
      )
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      await signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })
  })
})