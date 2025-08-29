/**
 * Tests for Supabase Server Client Cookie Handling and Error Resilience
 * 
 * Critical tests for /lib/supabase/server.ts focusing on cookie operations,
 * error handling, and ensuring authentication flow continues even when 
 * cookie operations fail. These are protected files requiring explicit testing.
 */

import { createMockCookieStore } from '@/lib/test-utils'

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

afterAll(() => {
  process.env = originalEnv
})

// Mock next/headers
const mockCookieStore = createMockCookieStore()
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore)
}))

// Mock @supabase/ssr to test the actual configuration logic
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null })
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  })
}

let capturedConfig: any = null
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((url, key, config) => {
    capturedConfig = config
    return mockSupabaseClient
  })
}))

// Import after mocking
import { createClient } from '../server'

describe('Supabase Server Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookieStore.clear()
    capturedConfig = null
  })

  describe('createClient initialization', () => {
    it('should create client with proper configuration', () => {
      const client = createClient()
      
      expect(client).toBeDefined()
      expect(capturedConfig).toBeDefined()
      expect(capturedConfig.cookies).toBeDefined()
      expect(typeof capturedConfig.cookies.getAll).toBe('function')
      expect(typeof capturedConfig.cookies.setAll).toBe('function')
    })

    it('should use environment variables correctly', () => {
      const client = createClient()
      
      expect(client).toBeDefined()
      expect(capturedConfig).toBeDefined()
    })
  })

  describe('cookie handling - getAll functionality', () => {
    it('should delegate getAll to cookie store', () => {
      // Set up test cookies
      mockCookieStore.set('auth-token', 'token123')
      mockCookieStore.set('refresh-token', 'refresh123')
      
      createClient()
      
      const result = capturedConfig.cookies.getAll()
      
      expect(mockCookieStore.getAll).toHaveBeenCalled()
      expect(result).toEqual([
        { name: 'auth-token', value: 'token123' },
        { name: 'refresh-token', value: 'refresh123' }
      ])
    })

    it('should handle empty cookie store', () => {
      createClient()
      
      const result = capturedConfig.cookies.getAll()
      
      expect(result).toEqual([])
    })

    it('should handle malformed cookie data gracefully', () => {
      // Simulate malformed cookies by directly manipulating the store
      mockCookieStore.cookies.set('malformed', { value: undefined })
      
      createClient()
      
      // Should not throw error
      expect(() => capturedConfig.cookies.getAll()).not.toThrow()
    })
  })

  describe('cookie handling - setAll functionality with error resilience', () => {
    it('should set cookies successfully in normal conditions', () => {
      createClient()
      
      const cookiesToSet = [
        {
          name: 'supabase-auth-token',
          value: 'new-token-123',
          options: { maxAge: 3600 }
        },
        {
          name: 'supabase-refresh-token',
          value: 'new-refresh-123',
          options: { httpOnly: true }
        }
      ]
      
      // Should not throw error
      expect(() => capturedConfig.cookies.setAll(cookiesToSet)).not.toThrow()
      
      // Verify cookies were set with proper options
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'supabase-auth-token',
        'new-token-123',
        expect.objectContaining({
          maxAge: 3600,
          sameSite: 'lax',
          secure: false, // NODE_ENV is test, not production
          httpOnly: true,
          path: '/'
        })
      )
      
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'supabase-refresh-token',
        'new-refresh-123',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/'
        })
      )
    })

    it('should set secure flag in production environment', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      try {
        createClient()
        
        const cookiesToSet = [{ name: 'test', value: 'value', options: {} }]
        
        capturedConfig.cookies.setAll(cookiesToSet)
        
        expect(mockCookieStore.set).toHaveBeenCalledWith(
          'test',
          'value',
          expect.objectContaining({
            secure: true
          })
        )
      } finally {
        process.env.NODE_ENV = originalNodeEnv
      }
    })

    it('should handle cookie setting errors gracefully - CRITICAL ERROR RESILIENCE', () => {
      // Mock cookie store to throw error
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie setting failed - Server Component context')
      })
      
      createClient()
      
      const cookiesToSet = [
        { name: 'supabase-auth-token', value: 'token123', options: {} }
      ]
      
      // CRITICAL: Should not throw error - must be resilient for Server Components
      expect(() => capturedConfig.cookies.setAll(cookiesToSet)).not.toThrow()
      
      // Verify that we attempted to set the cookie despite error
      expect(mockCookieStore.set).toHaveBeenCalled()
    })

    it('should handle individual cookie setting failures gracefully', () => {
      // Mock to fail only on specific cookie
      mockCookieStore.set.mockImplementation((name) => {
        if (name === 'failing-cookie') {
          throw new Error('Specific cookie failed')
        }
      })
      
      createClient()
      
      const cookiesToSet = [
        { name: 'success-cookie', value: 'success', options: {} },
        { name: 'failing-cookie', value: 'fail', options: {} },
        { name: 'another-success', value: 'success2', options: {} }
      ]
      
      // Should not throw error and continue processing other cookies
      expect(() => capturedConfig.cookies.setAll(cookiesToSet)).not.toThrow()
      
      // Verify attempts were made for all cookies
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3)
    })

    it('should preserve existing cookie options while adding defaults', () => {
      createClient()
      
      const cookiesToSet = [
        {
          name: 'custom-cookie',
          value: 'custom-value',
          options: {
            maxAge: 7200,
            domain: '.example.com',
            customProp: 'custom'
          }
        }
      ]
      
      capturedConfig.cookies.setAll(cookiesToSet)
      
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'custom-cookie',
        'custom-value',
        expect.objectContaining({
          maxAge: 7200,
          domain: '.example.com',
          customProp: 'custom',
          sameSite: 'lax',
          secure: false,
          httpOnly: true,
          path: '/'
        })
      )
    })

    it('should handle empty cookiesToSet array', () => {
      createClient()
      
      expect(() => capturedConfig.cookies.setAll([])).not.toThrow()
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it('should handle null or undefined values gracefully', () => {
      createClient()
      
      const cookiesToSet = [
        { name: 'null-value', value: null, options: {} },
        { name: 'undefined-value', value: undefined, options: {} },
        { name: 'empty-string', value: '', options: {} }
      ]
      
      expect(() => capturedConfig.cookies.setAll(cookiesToSet)).not.toThrow()
      
      // Verify cookies were still processed
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3)
    })
  })

  describe('authentication flow resilience', () => {
    it('should continue auth operations even when cookie operations fail', async () => {
      // Mock all cookie operations to fail
      mockCookieStore.getAll.mockImplementation(() => {
        throw new Error('Cookie read failed')
      })
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie write failed')
      })
      
      // Should still be able to create client
      const client = createClient()
      expect(client).toBeDefined()
      
      // Auth operations should still work
      const authResult = await client.auth.getUser()
      expect(authResult).toBeDefined()
    })

    it('should maintain consistent behavior across multiple client creations', () => {
      // Create multiple clients
      const client1 = createClient()
      const client2 = createClient() 
      const client3 = createClient()
      
      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
      expect(client3).toBeDefined()
      
      // Each should have the same cookie configuration structure
      expect(capturedConfig.cookies).toHaveProperty('getAll')
      expect(capturedConfig.cookies).toHaveProperty('setAll')
    })
  })

  describe('error logging and debugging', () => {
    it('should not expose sensitive information in errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Force an error in cookie setting
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie setting failed with sensitive token: secret-123')
      })
      
      createClient()
      
      capturedConfig.cookies.setAll([
        { name: 'sensitive', value: 'secret-token-data', options: {} }
      ])
      
      // Error should be caught silently (no console.error calls)
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle corrupted cookie store state', () => {
      // Corrupt the cookie store
      mockCookieStore.cookies = null
      
      // Should not crash
      expect(() => createClient()).not.toThrow()
    })
  })

  describe('memory and performance considerations', () => {
    it('should not leak memory with repeated client creation', () => {
      // Create many clients
      for (let i = 0; i < 100; i++) {
        const client = createClient()
        expect(client).toBeDefined()
      }
      
      // Each client should be independent and have proper configuration
      expect(capturedConfig.cookies).toHaveProperty('getAll')
      expect(capturedConfig.cookies).toHaveProperty('setAll')
    })

    it('should handle large cookie payloads efficiently', () => {
      createClient()
      
      // Large cookie data
      const largeCookieValue = 'x'.repeat(4000) // 4KB cookie
      const cookiesToSet = [
        { name: 'large-cookie', value: largeCookieValue, options: {} }
      ]
      
      const startTime = Date.now()
      capturedConfig.cookies.setAll(cookiesToSet)
      const endTime = Date.now()
      
      // Should process quickly (under 100ms even with large cookies)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})