/**
 * Authentication Test Helpers
 * 
 * Utilities for testing authentication flows and states in the INOPNC Work Management System.
 * Provides helpers for mocking auth states, creating sessions, and waiting for auth transitions.
 */

import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'

// Auth state types
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export interface MockAuthContext {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: jest.Mock
  signIn: jest.Mock
  signUp: jest.Mock
}

// Create mock auth state
export function mockAuthState(
  state: AuthState,
  overrides?: {
    user?: Partial<User>
    profile?: Partial<Profile>
    session?: Partial<Session>
    error?: Error
  }
): MockAuthContext {
  const baseUser: User = {
    id: faker.string.uuid(),
    aud: 'authenticated',
    role: 'authenticated',
    email: faker.internet.email(),
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false
  }

  const baseProfile: Profile = {
    id: baseUser.id,
    name: faker.person.fullName(),
    email: baseUser.email!,
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement(['worker', 'site_manager', 'customer_manager', 'admin']),
    organization_id: faker.string.uuid(),
    site_id: faker.datatype.boolean() ? faker.string.uuid() : null,
    position: faker.person.jobTitle(),
    hire_date: faker.date.past().toISOString(),
    is_active: true,
    avatar_url: faker.image.avatar(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const baseSession: Session = {
    access_token: faker.string.alphanumeric(64),
    refresh_token: faker.string.alphanumeric(64),
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: baseUser
  }

  switch (state) {
    case 'loading':
      return {
        user: null,
        session: null,
        profile: null,
        loading: true,
        signOut: jest.fn(),
        signIn: jest.fn(),
        signUp: jest.fn()
      }

    case 'authenticated':
      return {
        user: { ...baseUser, ...overrides?.user },
        session: { ...baseSession, ...overrides?.session },
        profile: { ...baseProfile, ...overrides?.profile },
        loading: false,
        signOut: jest.fn().mockResolvedValue({ error: null }),
        signIn: jest.fn().mockResolvedValue({ 
          data: { user: baseUser, session: baseSession },
          error: null 
        }),
        signUp: jest.fn().mockResolvedValue({ 
          data: { user: baseUser, session: baseSession },
          error: null 
        })
      }

    case 'unauthenticated':
      return {
        user: null,
        session: null,
        profile: null,
        loading: false,
        signOut: jest.fn().mockResolvedValue({ error: null }),
        signIn: jest.fn().mockResolvedValue({ 
          data: { user: baseUser, session: baseSession },
          error: null 
        }),
        signUp: jest.fn().mockResolvedValue({ 
          data: { user: baseUser, session: baseSession },
          error: null 
        })
      }

    case 'error':
      const error = overrides?.error || new Error('Authentication failed')
      return {
        user: null,
        session: null,
        profile: null,
        loading: false,
        signOut: jest.fn().mockResolvedValue({ error }),
        signIn: jest.fn().mockResolvedValue({ data: null, error }),
        signUp: jest.fn().mockResolvedValue({ data: null, error })
      }

    default:
      throw new Error(`Unknown auth state: ${state}`)
  }
}

// Create mock session with realistic data
export function createMockSession(overrides?: Partial<Session>): Session {
  const user: User = {
    id: faker.string.uuid(),
    aud: 'authenticated',
    role: 'authenticated',
    email: `${faker.person.firstName().toLowerCase()}.${faker.person.lastName().toLowerCase()}@inopnc.com`,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email']
    },
    user_metadata: {
      name: faker.person.fullName(),
      avatar_url: faker.image.avatar()
    },
    identities: [{
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      identity_data: {
        email: faker.internet.email(),
        sub: faker.string.uuid()
      },
      provider: 'email',
      last_sign_in_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false
  }

  return {
    access_token: faker.string.alphanumeric(64),
    refresh_token: faker.string.alphanumeric(64),
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
    ...overrides
  }
}

// Wait for authentication state to change
export async function waitForAuth(
  expectedState: AuthState,
  options: {
    timeout?: number
    interval?: number
    mockClient?: ReturnType<typeof createMockSupabaseClient>
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, mockClient } = options
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkAuth = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for auth state: ${expectedState}`))
        return
      }

      // Mock implementation - in real tests, you'd check actual auth state
      if (mockClient) {
        const session = mockClient.auth.getSession()
        const currentState: AuthState = session ? 'authenticated' : 'unauthenticated'
        
        if (currentState === expectedState) {
          resolve()
          return
        }
      }

      setTimeout(checkAuth, interval)
    }

    checkAuth()
  })
}

// Simulate auth state transition
export async function simulateAuthTransition(
  fromState: AuthState,
  toState: AuthState,
  options: {
    mockClient?: ReturnType<typeof createMockSupabaseClient>
    delay?: number
  } = {}
): Promise<void> {
  const { mockClient, delay = 100 } = options

  if (!mockClient) {
    throw new Error('mockClient is required for auth transition simulation')
  }

  // Simulate loading state
  if (fromState !== 'loading' && toState !== fromState) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  switch (toState) {
    case 'authenticated':
      const session = createMockSession()
      triggerAuthStateChange(mockClient, 'SIGNED_IN', session)
      break

    case 'unauthenticated':
      triggerAuthStateChange(mockClient, 'SIGNED_OUT', null)
      break

    case 'error':
      // Trigger auth error - this would be implementation specific
      break
  }

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Mock profile for different roles
export function createMockProfile(role: Profile['role'], overrides?: Partial<Profile>): Profile {
  const baseProfile: Profile = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: `${faker.person.firstName().toLowerCase()}.${faker.person.lastName().toLowerCase()}@inopnc.com`,
    phone: faker.phone.number(),
    role,
    organization_id: faker.string.uuid(),
    site_id: null,
    position: '',
    hire_date: faker.date.past().toISOString(),
    is_active: true,
    avatar_url: faker.image.avatar(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Role-specific defaults
  switch (role) {
    case 'worker':
      baseProfile.position = faker.helpers.arrayElement(['작업자', '기능공', '현장보조'])
      baseProfile.site_id = faker.string.uuid()
      break

    case 'site_manager':
      baseProfile.position = faker.helpers.arrayElement(['현장소장', '현장관리자', '안전관리자'])
      baseProfile.site_id = faker.string.uuid()
      break

    case 'customer_manager':
      baseProfile.position = faker.helpers.arrayElement(['발주처 담당자', '감리단', '현장책임자'])
      baseProfile.site_id = faker.string.uuid()
      break

    case 'admin':
      baseProfile.position = faker.helpers.arrayElement(['시스템 관리자', '본사 관리자', '인사담당자'])
      baseProfile.site_id = null // Admins can access all sites
      break

    case 'system_admin':
      baseProfile.position = '시스템 관리자'
      baseProfile.site_id = null
      break
  }

  return { ...baseProfile, ...overrides }
}

// Test different auth scenarios
export const authScenarios = {
  // Common test scenarios
  workerAuthenticated: () => mockAuthState('authenticated', {
    profile: createMockProfile('worker')
  }),

  managerAuthenticated: () => mockAuthState('authenticated', {
    profile: createMockProfile('site_manager')
  }),

  adminAuthenticated: () => mockAuthState('authenticated', {
    profile: createMockProfile('admin')
  }),

  customerAuthenticated: () => mockAuthState('authenticated', {
    profile: createMockProfile('customer_manager')
  }),

  unauthenticated: () => mockAuthState('unauthenticated'),

  loading: () => mockAuthState('loading'),

  authError: (message = 'Authentication failed') => mockAuthState('error', {
    error: new Error(message)
  }),

  expiredSession: () => mockAuthState('authenticated', {
    session: createMockSession({
      expires_at: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    })
  }),

  newUser: () => {
    const auth = mockAuthState('authenticated', {
      user: {
        email_confirmed_at: null,
        confirmed_at: null
      }
    })
    // Override profile to be null for new users
    auth.profile = null
    return auth
  }
}