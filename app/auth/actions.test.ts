/**
 * Test suite for Authentication Actions
 * Tests login, signup, and auth-related server actions
 */

import { signIn, signUp, signOut } from './actions'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}))

describe('Authentication Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'Test123!@#')

      // Mock successful sign in
      const { createClient } = require('@/lib/supabase/server')
      const mockClient = createClient()
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      })

      await signIn(formData)

      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Test123!@#',
      })
    })

    it('should handle invalid credentials', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrong')

      const { createClient } = require('@/lib/supabase/server')
      const mockClient = createClient()
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      await signIn(formData)

      expect(mockClient.auth.signInWithPassword).toHaveBeenCalled()
    })
  })

  describe('signUp', () => {
    it('should successfully create a new account', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'Test123!@#')
      formData.append('fullName', 'Test User')

      const { createClient } = require('@/lib/supabase/server')
      const mockClient = createClient()
      mockClient.auth.signUp.mockResolvedValue({
        data: { user: { id: '456', email: 'newuser@example.com' } },
        error: null,
      })

      await signUp(formData)

      expect(mockClient.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          password: 'Test123!@#',
        })
      )
    })

    it('should handle duplicate email', async () => {
      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'Test123!@#')

      const { createClient } = require('@/lib/supabase/server')
      const mockClient = createClient()
      mockClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      })

      await signUp(formData)

      expect(mockClient.auth.signUp).toHaveBeenCalled()
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockClient = createClient()
      mockClient.auth.signOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockClient.auth.signOut).toHaveBeenCalled()
    })
  })
})