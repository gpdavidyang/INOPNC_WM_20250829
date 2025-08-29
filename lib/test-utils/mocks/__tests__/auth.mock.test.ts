/**
 * Tests for Authentication Mock Utilities
 * 
 * Comprehensive tests ensuring auth mocks behave correctly and simulate
 * real Supabase authentication scenarios for reliable testing.
 */

import {
  createMockUser,
  createMockSession,
  createMockAuthResponse,
  createMockAuthError,
  createMockCookieStore,
  createMockSupabaseAuthClient,
  createMockProfile,
  createMockNextRequest,
  authScenarios,
  setupAuthTestContext,
  errorSimulation,
  type MockAuthUser,
  type MockAuthSession,
  type MockCookieStore,
  type MockSupabaseAuthClient
} from '../auth.mock'

describe('Auth Mock Utilities', () => {
  describe('createMockUser', () => {
    it('should create a valid mock user with defaults', () => {
      const user = createMockUser()
      
      expect(user.id).toBeDefined()
      expect(user.email).toContain('@')
      expect(user.aud).toBe('authenticated')
      expect(user.role).toBe('authenticated')
      expect(user.created_at).toBeDefined()
      expect(user.app_metadata.provider).toBe('email')
      expect(user.user_metadata.role).toBe('worker')
    })

    it('should accept overrides', () => {
      const customEmail = 'test@example.com'
      const customRole = 'admin'
      
      const user = createMockUser({
        email: customEmail,
        user_metadata: { role: customRole }
      })
      
      expect(user.email).toBe(customEmail)
      expect(user.user_metadata.role).toBe(customRole)
    })

    it('should generate unique IDs for each user', () => {
      const user1 = createMockUser()
      const user2 = createMockUser()
      
      expect(user1.id).not.toBe(user2.id)
      expect(user1.email).not.toBe(user2.email)
    })
  })

  describe('createMockSession', () => {
    it('should create a valid mock session with default user', () => {
      const session = createMockSession()
      
      expect(session.access_token).toBeDefined()
      expect(session.refresh_token).toBeDefined()
      expect(session.expires_in).toBe(3600)
      expect(session.token_type).toBe('bearer')
      expect(session.user).toBeDefined()
      expect(session.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should use provided user', () => {
      const user = createMockUser({ email: 'custom@test.com' })
      const session = createMockSession(user)
      
      expect(session.user.email).toBe('custom@test.com')
      expect(session.user.id).toBe(user.id)
    })

    it('should generate unique tokens', () => {
      const session1 = createMockSession()
      const session2 = createMockSession()
      
      expect(session1.access_token).not.toBe(session2.access_token)
      expect(session1.refresh_token).not.toBe(session2.refresh_token)
    })
  })

  describe('createMockAuthResponse', () => {
    it('should create response with null values by default', () => {
      const response = createMockAuthResponse()
      
      expect(response.data.user).toBeNull()
      expect(response.data.session).toBeNull()
      expect(response.error).toBeNull()
    })

    it('should create response with provided data', () => {
      const user = createMockUser()
      const session = createMockSession(user)
      const error = createMockAuthError('Test error')
      
      const response = createMockAuthResponse({ user, session, error })
      
      expect(response.data.user).toBe(user)
      expect(response.data.session).toBe(session)
      expect(response.error).toBe(error)
    })
  })

  describe('createMockAuthError', () => {
    it('should create auth error with message and status', () => {
      const error = createMockAuthError('Invalid credentials', 401)
      
      expect(error.message).toBe('Invalid credentials')
      expect(error.status).toBe(401)
      expect(error.name).toBe('AuthError')
    })

    it('should use default status', () => {
      const error = createMockAuthError('Test error')
      
      expect(error.status).toBe(400)
    })
  })

  describe('createMockCookieStore', () => {
    let cookieStore: MockCookieStore

    beforeEach(() => {
      cookieStore = createMockCookieStore()
    })

    it('should create empty cookie store', () => {
      expect(cookieStore.getAll()).toEqual([])
      expect(cookieStore.get('nonexistent')).toBeUndefined()
    })

    it('should set and get cookies', () => {
      cookieStore.set('test', 'value', { httpOnly: true })
      
      const cookie = cookieStore.get('test')
      expect(cookie).toEqual({
        name: 'test',
        value: 'value',
        httpOnly: true
      })
    })

    it('should list all cookies', () => {
      cookieStore.set('cookie1', 'value1')
      cookieStore.set('cookie2', 'value2', { secure: true })
      
      const allCookies = cookieStore.getAll()
      expect(allCookies).toHaveLength(2)
      expect(allCookies).toEqual(
        expect.arrayContaining([
          { name: 'cookie1', value: 'value1' },
          { name: 'cookie2', value: 'value2', secure: true }
        ])
      )
    })

    it('should delete cookies', () => {
      cookieStore.set('test', 'value')
      expect(cookieStore.get('test')).toBeDefined()
      
      cookieStore.delete('test')
      expect(cookieStore.get('test')).toBeUndefined()
    })

    it('should clear all cookies', () => {
      cookieStore.set('cookie1', 'value1')
      cookieStore.set('cookie2', 'value2')
      
      cookieStore.clear()
      expect(cookieStore.getAll()).toEqual([])
    })

    it('should verify mocks are called', () => {
      cookieStore.set('test', 'value')
      cookieStore.get('test')
      cookieStore.delete('test')
      cookieStore.clear()
      
      expect(cookieStore.set).toHaveBeenCalledWith('test', 'value')
      expect(cookieStore.get).toHaveBeenCalledWith('test')
      expect(cookieStore.delete).toHaveBeenCalledWith('test')
      expect(cookieStore.clear).toHaveBeenCalled()
    })
  })

  describe('createMockSupabaseAuthClient', () => {
    let authClient: MockSupabaseAuthClient

    beforeEach(() => {
      authClient = createMockSupabaseAuthClient()
    })

    describe('getUser', () => {
      it('should return null user by default', async () => {
        const response = await authClient.getUser()
        
        expect(response.data.user).toBeNull()
        expect(response.error).toBeNull()
      })

      it('should return provided default user', async () => {
        const user = createMockUser()
        authClient = createMockSupabaseAuthClient({ defaultUser: user })
        
        const response = await authClient.getUser()
        
        expect(response.data.user).toBe(user)
        expect(response.error).toBeNull()
      })

      it('should return error when configured to throw', async () => {
        authClient = createMockSupabaseAuthClient({ shouldThrowErrors: true })
        
        const response = await authClient.getUser()
        
        expect(response.data.user).toBeNull()
        expect(response.error?.message).toBe('Invalid JWT')
      })
    })

    describe('signInWithPassword', () => {
      it('should sign in successfully with valid credentials', async () => {
        const email = 'test@example.com'
        const password = 'password123'
        
        const response = await authClient.signInWithPassword({ email, password })
        
        expect(response.data.user?.email).toBe(email)
        expect(response.data.session).toBeDefined()
        expect(response.error).toBeNull()
      })

      it('should fail with invalid password', async () => {
        const response = await authClient.signInWithPassword({
          email: 'test@example.com',
          password: 'invalid'
        })
        
        expect(response.data.user).toBeNull()
        expect(response.data.session).toBeNull()
        expect(response.error?.message).toBe('Invalid login credentials')
      })

      it('should fail when configured to throw errors', async () => {
        authClient = createMockSupabaseAuthClient({ shouldThrowErrors: true })
        
        const response = await authClient.signInWithPassword({
          email: 'test@example.com',
          password: 'password123'
        })
        
        expect(response.error?.message).toBe('Invalid login credentials')
      })
    })

    describe('signUp', () => {
      it('should sign up successfully', async () => {
        const email = 'newuser@example.com'
        const password = 'password123'
        const userData = { full_name: 'Test User', role: 'worker' }
        
        const response = await authClient.signUp({
          email,
          password,
          options: { data: userData }
        })
        
        expect(response.data.user?.email).toBe(email)
        expect(response.data.user?.user_metadata).toEqual(userData)
        expect(response.data.session).toBeDefined()
        expect(response.error).toBeNull()
      })

      it('should fail with duplicate email', async () => {
        const response = await authClient.signUp({
          email: 'duplicate@test.com',
          password: 'password123'
        })
        
        expect(response.error?.message).toBe('User already registered')
      })
    })

    describe('signOut', () => {
      it('should sign out successfully', async () => {
        const response = await authClient.signOut()
        
        expect(response.data.user).toBeNull()
        expect(response.data.session).toBeNull()
        expect(response.error).toBeNull()
      })

      it('should fail when configured to throw errors', async () => {
        authClient = createMockSupabaseAuthClient({ shouldThrowErrors: true })
        
        const response = await authClient.signOut()
        
        expect(response.error?.message).toBe('Failed to sign out')
      })
    })

    describe('refreshSession', () => {
      it('should refresh session successfully', async () => {
        const user = createMockUser()
        authClient = createMockSupabaseAuthClient({ defaultUser: user })
        
        const response = await authClient.refreshSession()
        
        expect(response.data.user).toBeDefined()
        expect(response.data.session).toBeDefined()
        expect(response.error).toBeNull()
      })

      it('should fail when configured to throw errors', async () => {
        authClient = createMockSupabaseAuthClient({ shouldThrowErrors: true })
        
        const response = await authClient.refreshSession()
        
        expect(response.error?.message).toBe('Refresh token expired')
      })
    })

    describe('onAuthStateChange', () => {
      it('should set up auth state change listener', () => {
        const callback = jest.fn()
        const session = createMockSession()
        authClient = createMockSupabaseAuthClient({ defaultSession: session })
        
        const subscription = authClient.onAuthStateChange(callback)
        
        expect(subscription.data.subscription.unsubscribe).toBeDefined()
        
        // Wait for async callback
        setTimeout(() => {
          expect(callback).toHaveBeenCalledWith('SIGNED_IN', session)
        }, 10)
      })
    })
  })

  describe('createMockProfile', () => {
    it('should create worker profile by default', () => {
      const profile = createMockProfile()
      
      expect(profile.role).toBe('worker')
      expect(profile.position).toBe('작업자')
      expect(profile.is_active).toBe(true)
      expect(profile.site_id).toBeDefined()
    })

    it('should create customer manager without site', () => {
      const profile = createMockProfile('customer_manager')
      
      expect(profile.role).toBe('customer_manager')
      expect(profile.position).toBe('고객담당자')
      expect(profile.site_id).toBeNull()
    })

    it('should accept overrides', () => {
      const customName = 'Custom User'
      const profile = createMockProfile('admin', { name: customName })
      
      expect(profile.role).toBe('admin')
      expect(profile.name).toBe(customName)
      expect(profile.position).toBe('관리자')
    })
  })

  describe('createMockNextRequest', () => {
    it('should create request with defaults', () => {
      const request = createMockNextRequest()
      
      expect(request.url).toBe('http://localhost:3000/dashboard')
      expect(request.method).toBe('GET')
      expect(request.nextUrl?.pathname).toBe('/dashboard')
    })

    it('should accept custom options', () => {
      const request = createMockNextRequest({
        url: 'http://localhost:3000/auth/login',
        pathname: '/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { 'auth-token': 'test123' }
      })
      
      expect(request.url).toBe('http://localhost:3000/auth/login')
      expect(request.method).toBe('POST')
      expect(request.nextUrl?.pathname).toBe('/auth/login')
      expect(request.headers?.get('Content-Type')).toBe('application/json')
      expect(request.cookies?.get('auth-token')).toEqual({
        name: 'auth-token',
        value: 'test123'
      })
    })
  })

  describe('authScenarios', () => {
    it('should provide authenticated worker scenario', () => {
      const scenario = authScenarios.authenticatedWorker()
      
      expect(scenario.user).toBeDefined()
      expect(scenario.session).toBeDefined()
      expect(scenario.profile?.role).toBe('worker')
      expect(scenario.user?.user_metadata.role).toBe('worker')
    })

    it('should provide authenticated manager scenario', () => {
      const scenario = authScenarios.authenticatedManager()
      
      expect(scenario.user).toBeDefined()
      expect(scenario.session).toBeDefined()
      expect(scenario.profile?.role).toBe('site_manager')
      expect(scenario.user?.user_metadata.role).toBe('site_manager')
    })

    it('should provide authenticated admin scenario', () => {
      const scenario = authScenarios.authenticatedAdmin()
      
      expect(scenario.user).toBeDefined()
      expect(scenario.session).toBeDefined()
      expect(scenario.profile?.role).toBe('admin')
      expect(scenario.user?.user_metadata.role).toBe('admin')
    })

    it('should provide unauthenticated scenario', () => {
      const scenario = authScenarios.unauthenticated()
      
      expect(scenario.user).toBeNull()
      expect(scenario.session).toBeNull()
      expect(scenario.profile).toBeNull()
    })

    it('should provide expired session scenario', () => {
      const scenario = authScenarios.expiredSession()
      
      expect(scenario.user).toBeDefined()
      expect(scenario.session).toBeDefined()
      expect(scenario.session?.expires_at).toBeLessThan(Math.floor(Date.now() / 1000))
    })

    it('should provide auth error scenario', () => {
      const scenario = authScenarios.authError('Custom error')
      
      expect(scenario.user).toBeNull()
      expect(scenario.session).toBeNull()
      expect(scenario.profile).toBeNull()
      expect(scenario.error?.message).toBe('Custom error')
    })
  })

  describe('setupAuthTestContext', () => {
    it('should set up authenticated context', () => {
      const context = setupAuthTestContext('authenticatedWorker')
      
      expect(context.authClient).toBeDefined()
      expect(context.cookieStore).toBeDefined()
      expect(context.authData.user).toBeDefined()
      expect(context.authData.session).toBeDefined()
      expect(context.cleanup).toBeInstanceOf(Function)
      
      // Check cookies are set
      expect(context.cookieStore.get('supabase-auth-token')).toBeDefined()
      expect(context.cookieStore.get('supabase-refresh-token')).toBeDefined()
    })

    it('should set up unauthenticated context', () => {
      const context = setupAuthTestContext('unauthenticated')
      
      expect(context.authData.user).toBeNull()
      expect(context.authData.session).toBeNull()
      
      // Check no auth cookies are set
      expect(context.cookieStore.get('supabase-auth-token')).toBeUndefined()
      expect(context.cookieStore.get('supabase-refresh-token')).toBeUndefined()
    })

    it('should provide cleanup function', () => {
      const context = setupAuthTestContext('authenticatedWorker')
      
      context.cookieStore.set('test', 'value')
      expect(context.cookieStore.get('test')).toBeDefined()
      
      context.cleanup()
      
      // Check mocks are cleared (cookies map should be empty)
      expect(context.cookieStore.getAll()).toEqual([])
    })
  })

  describe('errorSimulation', () => {
    it('should provide various error types', () => {
      expect(errorSimulation.networkError().status).toBe(0)
      expect(errorSimulation.invalidCredentials().status).toBe(400)
      expect(errorSimulation.userNotFound().status).toBe(404)
      expect(errorSimulation.emailAlreadyExists().status).toBe(422)
      expect(errorSimulation.sessionExpired().status).toBe(401)
      expect(errorSimulation.refreshTokenExpired().status).toBe(401)
      expect(errorSimulation.rateLimited().status).toBe(429)
      expect(errorSimulation.serverError().status).toBe(500)
    })

    it('should provide appropriate error messages', () => {
      expect(errorSimulation.invalidCredentials().message).toBe('Invalid login credentials')
      expect(errorSimulation.userNotFound().message).toBe('User not found')
      expect(errorSimulation.emailAlreadyExists().message).toBe('User already registered')
      expect(errorSimulation.rateLimited().message).toBe('Too many requests')
    })
  })
})