import {
  mockAuthState,
  createMockSession,
  createMockProfile,
  authScenarios
} from '../auth-helpers'

describe('Auth Helpers', () => {
  describe('mockAuthState', () => {
    it('should create loading state', () => {
      const auth = mockAuthState('loading')
      
      expect(auth.loading).toBe(true)
      expect(auth.user).toBeNull()
      expect(auth.session).toBeNull()
      expect(auth.profile).toBeNull()
    })

    it('should create authenticated state', () => {
      const auth = mockAuthState('authenticated')
      
      expect(auth.loading).toBe(false)
      expect(auth.user).toBeDefined()
      expect(auth.session).toBeDefined()
      expect(auth.profile).toBeDefined()
      expect(auth.user?.email).toContain('@')
    })

    it('should create unauthenticated state', () => {
      const auth = mockAuthState('unauthenticated')
      
      expect(auth.loading).toBe(false)
      expect(auth.user).toBeNull()
      expect(auth.session).toBeNull()
      expect(auth.profile).toBeNull()
    })

    it('should create error state', () => {
      const errorMessage = 'Custom auth error'
      const auth = mockAuthState('error', { error: new Error(errorMessage) })
      
      expect(auth.loading).toBe(false)
      expect(auth.user).toBeNull()
      expect(auth.session).toBeNull()
      expect(auth.profile).toBeNull()
    })

    it('should allow overrides', () => {
      const customEmail = 'custom@inopnc.com'
      const auth = mockAuthState('authenticated', {
        user: { email: customEmail },
        profile: { name: 'Custom User' }
      })
      
      expect(auth.user?.email).toBe(customEmail)
      expect(auth.profile?.name).toBe('Custom User')
    })
  })

  describe('createMockSession', () => {
    it('should create valid session', () => {
      const session = createMockSession()
      
      expect(session.access_token).toBeDefined()
      expect(session.refresh_token).toBeDefined()
      expect(session.user).toBeDefined()
      expect(session.user.email).toContain('@inopnc.com')
      expect(session.expires_at).toBeGreaterThan(Date.now() / 1000)
    })

    it('should allow overrides', () => {
      const customUserId = 'custom-user-id'
      const session = createMockSession({
        user: { id: customUserId }
      })
      
      expect(session.user.id).toBe(customUserId)
    })
  })

  describe('createMockProfile', () => {
    it('should create worker profile', () => {
      const profile = createMockProfile('worker')
      
      expect(profile.role).toBe('worker')
      expect(profile.site_id).toBeDefined()
      expect(profile.position).toMatch(/작업자|기능공|현장보조/)
    })

    it('should create site manager profile', () => {
      const profile = createMockProfile('site_manager')
      
      expect(profile.role).toBe('site_manager')
      expect(profile.site_id).toBeDefined()
      expect(profile.position).toMatch(/현장소장|현장관리자|안전관리자/)
    })

    it('should create admin profile', () => {
      const profile = createMockProfile('admin')
      
      expect(profile.role).toBe('admin')
      expect(profile.site_id).toBeNull()
      expect(profile.position).toMatch(/시스템 관리자|본사 관리자|인사담당자/)
    })

    it('should create customer manager profile', () => {
      const profile = createMockProfile('customer_manager')
      
      expect(profile.role).toBe('customer_manager')
      expect(profile.site_id).toBeDefined()
      expect(profile.position).toMatch(/발주처 담당자|감리단|현장책임자/)
    })

    it('should allow overrides', () => {
      const customName = 'Custom Name'
      const profile = createMockProfile('worker', { name: customName })
      
      expect(profile.name).toBe(customName)
      expect(profile.role).toBe('worker')
    })
  })

  describe('authScenarios', () => {
    it('should provide worker authenticated scenario', () => {
      const auth = authScenarios.workerAuthenticated()
      
      expect(auth.user).toBeDefined()
      expect(auth.profile?.role).toBe('worker')
    })

    it('should provide manager authenticated scenario', () => {
      const auth = authScenarios.managerAuthenticated()
      
      expect(auth.user).toBeDefined()
      expect(auth.profile?.role).toBe('site_manager')
    })

    it('should provide admin authenticated scenario', () => {
      const auth = authScenarios.adminAuthenticated()
      
      expect(auth.user).toBeDefined()
      expect(auth.profile?.role).toBe('admin')
    })

    it('should provide customer authenticated scenario', () => {
      const auth = authScenarios.customerAuthenticated()
      
      expect(auth.user).toBeDefined()
      expect(auth.profile?.role).toBe('customer_manager')
    })

    it('should provide unauthenticated scenario', () => {
      const auth = authScenarios.unauthenticated()
      
      expect(auth.user).toBeNull()
      expect(auth.profile).toBeNull()
    })

    it('should provide loading scenario', () => {
      const auth = authScenarios.loading()
      
      expect(auth.loading).toBe(true)
      expect(auth.user).toBeNull()
    })

    it('should provide auth error scenario', () => {
      const auth = authScenarios.authError('Custom error')
      
      expect(auth.user).toBeNull()
      expect(auth.profile).toBeNull()
    })

    it('should provide expired session scenario', () => {
      const auth = authScenarios.expiredSession()
      
      expect(auth.session?.expires_at).toBeLessThan(Date.now() / 1000)
    })

    it('should provide new user scenario', () => {
      const auth = authScenarios.newUser()
      
      expect(auth.user?.email_confirmed_at).toBeNull()
      expect(auth.profile).toBeNull()
    })
  })
})