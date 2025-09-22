/**
 * Authentication Mock Utilities
 * 
 * Enhanced authentication mocks for testing middleware, server client, and auth actions
 * with comprehensive cookie handling and error simulation.
 */

import type { NextRequest, NextResponse } from 'next/server'
import type { Profile } from '@/types'

// Enhanced types for authentication testing
export interface MockAuthUser extends User {
  id: string
  email: string
  role?: string
  aud: string
  created_at: string
  updated_at: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  user_metadata: {
    full_name?: string
    phone?: string
    role?: string
  }
}

export interface MockAuthSession extends Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: 'bearer'
  user: MockAuthUser
}

export interface MockAuthResponse extends AuthResponse {
  data: {
    user: MockAuthUser | null
    session: MockAuthSession | null
  }
  error: AuthError | null
}

export interface MockCookieStore {
  cookies: Map<string, { value: string; options?: unknown }>
  getAll: jest.Mock
  get: jest.Mock
  set: jest.Mock
  delete: jest.Mock
  clear: jest.Mock
}

export interface MockSupabaseAuthClient {
  getUser: jest.Mock
  getSession: jest.Mock
  signInWithPassword: jest.Mock
  signUp: jest.Mock
  signOut: jest.Mock
  refreshSession: jest.Mock
  onAuthStateChange: jest.Mock
}

// Factory for creating mock users
export function createMockUser(overrides?: Partial<MockAuthUser>): MockAuthUser {
  const userId = faker.string.uuid()
  const email = faker.internet.email()
  const now = new Date().toISOString()
  
  return {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: now,
    phone: faker.phone.number(),
    confirmed_at: now,
    last_sign_in_at: now,
    created_at: now,
    updated_at: now,
    app_metadata: {
      provider: 'email',
      providers: ['email']
    },
    user_metadata: {
      full_name: faker.person.fullName(),
      phone: faker.phone.number(),
      role: 'worker'
    },
    identities: [],
    factors: [],
    ...overrides
  }
}

// Factory for creating mock sessions
export function createMockSession(user?: MockAuthUser): MockAuthSession {
  const mockUser = user || createMockUser()
  const now = Date.now()
  
  return {
    access_token: faker.string.alphanumeric(500),
    refresh_token: faker.string.alphanumeric(200),
    expires_in: 3600,
    expires_at: Math.floor(now / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  }
}

// Factory for creating mock auth responses
export function createMockAuthResponse(
  options: {
    user?: MockAuthUser | null
    session?: MockAuthSession | null
    error?: AuthError | null
  } = {}
): MockAuthResponse {
  const { user = null, session = null, error = null } = options
  
  return {
    data: { user, session },
    error
  }
}

// Factory for creating mock auth errors
export function createMockAuthError(
  message: string,
  status = 400
): AuthError {
  return {
    message,
    status,
    name: 'AuthError'
  } as AuthError
}

// Mock cookie store factory
export function createMockCookieStore(): MockCookieStore {
  const cookies = new Map<string, { value: string; options?: unknown }>()
  
  const mockStore = {
    cookies,
    getAll: jest.fn().mockImplementation(() => {
      return Array.from(cookies.entries()).map(([name, { value, options }]) => ({
        name,
        value,
        ...options
      }))
    }),
    get: jest.fn().mockImplementation((name: string) => {
      const cookie = cookies.get(name)
      return cookie ? { name, value: cookie.value, ...cookie.options } : undefined
    }),
    set: jest.fn().mockImplementation((name: string, value: string, options?: unknown) => {
      cookies.set(name, { value, options })
    }),
    delete: jest.fn().mockImplementation((name: string) => {
      cookies.delete(name)
    }),
    clear: jest.fn().mockImplementation(() => {
      cookies.clear()
    })
  }
  
  return mockStore
}

// Enhanced Supabase auth client mock
export function createMockSupabaseAuthClient(
  options: {
    defaultUser?: MockAuthUser | null
    defaultSession?: MockAuthSession | null
    shouldThrowErrors?: boolean
  } = {}
): MockSupabaseAuthClient {
  const { defaultUser = null, defaultSession = null, shouldThrowErrors = false } = options
  
  const mockClient = {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn()
  }
  
  // Configure default behaviors
  mockClient.getUser.mockImplementation(() => {
    if (shouldThrowErrors) {
      return Promise.resolve(createMockAuthResponse({
        error: createMockAuthError('Invalid JWT')
      }))
    }
    return Promise.resolve(createMockAuthResponse({ user: defaultUser }))
  })
  
  mockClient.getSession.mockImplementation(() => {
    if (shouldThrowErrors) {
      return Promise.resolve(createMockAuthResponse({
        error: createMockAuthError('Session expired')
      }))
    }
    return Promise.resolve(createMockAuthResponse({ session: defaultSession }))
  })
  
  mockClient.signInWithPassword.mockImplementation(({ email, password }) => {
    if (shouldThrowErrors || password === 'invalid') {
      return Promise.resolve(createMockAuthResponse({
        error: createMockAuthError('Invalid login credentials')
      }))
    }
    const user = createMockUser({ email })
    const session = createMockSession(user)
    return Promise.resolve(createMockAuthResponse({ user, session }))
  })
  
  mockClient.signUp.mockImplementation(({ email, password, options }) => {
    if (shouldThrowErrors || email === 'duplicate@test.com') {
      return Promise.resolve(createMockAuthResponse({
        error: createMockAuthError('User already registered')
      }))
    }
    const user = createMockUser({
      email,
      user_metadata: options?.data || {}
    })
    const session = createMockSession(user)
    return Promise.resolve(createMockAuthResponse({ user, session }))
  })
  
  mockClient.signOut.mockImplementation(() => {
    if (shouldThrowErrors) {
      return Promise.resolve(createMockAuthResponse({
        error: createMockAuthError('Failed to sign out')
      }))
    }
    return Promise.resolve(createMockAuthResponse({}))
  })
  
  mockClient.refreshSession.mockImplementation(() => {
    if (shouldThrowErrors) {
      return Promise.resolve(createMockAuthResponse({
        error: createMockAuthError('Refresh token expired')
      }))
    }
    const user = defaultUser || createMockUser()
    const session = createMockSession(user)
    return Promise.resolve(createMockAuthResponse({ user, session }))
  })
  
  mockClient.onAuthStateChange.mockImplementation((callback) => {
    // Simulate subscription
    const unsubscribe = jest.fn()
    
    // Simulate initial auth state
    setTimeout(() => {
      callback('SIGNED_IN', defaultSession)
    }, 0)
    
    return {
      data: {
        subscription: {
          unsubscribe
        }
      }
    }
  })
  
  return mockClient
}

// Mock profile factory that works with auth users
export function createMockProfile(
  role: Profile['role'] = 'worker',
  overrides?: Partial<Profile>
): Profile {
  const userId = faker.string.uuid()
  
  return {
    id: userId,
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role,
    phone: faker.phone.number(),
    position: getPositionByRole(role),
    organization_id: faker.string.uuid(),
    site_id: role === 'customer_manager' ? null : faker.string.uuid(),
    avatar_url: faker.image.avatar(),
    is_active: true,
    last_login_at: new Date().toISOString(),
    login_count: faker.number.int({ min: 1, max: 100 }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

function getPositionByRole(role: Profile['role']): string {
  const positions = {
    worker: '작업자',
    site_manager: '현장소장',
    customer_manager: '고객담당자',
    admin: '관리자',
    system_admin: '시스템관리자'
  }
  return positions[role] || '작업자'
}

// Mock NextRequest factory
export function createMockNextRequest(
  options: {
    url?: string
    pathname?: string
    method?: string
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
): Partial<NextRequest> {
  const {
    url = 'http://localhost:3000/dashboard',
    pathname = '/dashboard',
    method = 'GET',
    headers = {},
    cookies = {}
  } = options
  
  const mockRequest = {
    url,
    method,
    nextUrl: {
      pathname,
      searchParams: new URLSearchParams(),
      href: url,
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000'
    },
    headers: new Headers(headers),
    cookies: {
      get: jest.fn((name: string) => {
        const value = cookies[name]
        return value ? { name, value } : undefined
      }),
      getAll: jest.fn(() => {
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      }),
      set: jest.fn(),
      delete: jest.fn()
    }
  }
  
  return mockRequest as Partial<NextRequest>
}

// Auth testing scenarios
export const authScenarios = {
  authenticatedWorker: () => {
    const user = createMockUser({
      user_metadata: { role: 'worker' }
    })
    const session = createMockSession(user)
    return { user, session, profile: createMockProfile('worker') }
  },
  
  authenticatedManager: () => {
    const user = createMockUser({
      user_metadata: { role: 'site_manager' }
    })
    const session = createMockSession(user)
    return { user, session, profile: createMockProfile('site_manager') }
  },
  
  authenticatedAdmin: () => {
    const user = createMockUser({
      user_metadata: { role: 'admin' }
    })
    const session = createMockSession(user)
    return { user, session, profile: createMockProfile('admin') }
  },
  
  unauthenticated: () => ({
    user: null,
    session: null,
    profile: null
  }),
  
  expiredSession: () => {
    const user = createMockUser()
    const session = createMockSession(user)
    // Make session expired
    session.expires_at = Math.floor(Date.now() / 1000) - 3600
    return { user, session, profile: createMockProfile() }
  },
  
  authError: (message = 'Authentication failed') => ({
    user: null,
    session: null,
    profile: null,
    error: createMockAuthError(message)
  })
}

// Helper to set up auth context for tests
export function setupAuthTestContext(scenario: keyof typeof authScenarios) {
  const authData = authScenarios[scenario]()
  
  const mockAuthClient = createMockSupabaseAuthClient({
    defaultUser: authData.user,
    defaultSession: authData.session
  })
  
  const mockCookieStore = createMockCookieStore()
  
  // Set up auth cookies if authenticated
  if (authData.session) {
    mockCookieStore.set('supabase-auth-token', authData.session.access_token)
    mockCookieStore.set('supabase-refresh-token', authData.session.refresh_token)
  }
  
  return {
    authClient: mockAuthClient,
    cookieStore: mockCookieStore,
    authData,
    cleanup: () => {
      jest.clearAllMocks()
      mockCookieStore.clear()
    }
  }
}

// Error simulation helpers
export const errorSimulation = {
  networkError: () => createMockAuthError('Network error', 0),
  invalidCredentials: () => createMockAuthError('Invalid login credentials', 400),
  userNotFound: () => createMockAuthError('User not found', 404),
  emailAlreadyExists: () => createMockAuthError('User already registered', 422),
  sessionExpired: () => createMockAuthError('Session expired', 401),
  refreshTokenExpired: () => createMockAuthError('Refresh token expired', 401),
  rateLimited: () => createMockAuthError('Too many requests', 429),
  serverError: () => createMockAuthError('Internal server error', 500)
}