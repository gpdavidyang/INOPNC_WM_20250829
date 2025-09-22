import type { User, Session, AuthChangeEvent, AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock
    getSession: jest.Mock
    signIn: jest.Mock
    signOut: jest.Mock
    signUp: jest.Mock
    resetPasswordForEmail: jest.Mock
    updateUser: jest.Mock
    onAuthStateChange: jest.Mock
  }
  from: jest.Mock
  rpc: jest.Mock
  storage: {
    from: jest.Mock
  }
}

export interface MockQueryBuilder {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  upsert: jest.Mock
  delete: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  gt: jest.Mock
  gte: jest.Mock
  lt: jest.Mock
  lte: jest.Mock
  like: jest.Mock
  ilike: jest.Mock
  in: jest.Mock
  contains: jest.Mock
  containedBy: jest.Mock
  is: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  range: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
  or: jest.Mock
  not: jest.Mock
  filter: jest.Mock
  match: jest.Mock
  textSearch: jest.Mock
}

export interface MockStorageBucket {
  upload: jest.Mock
  download: jest.Mock
  list: jest.Mock
  remove: jest.Mock
  createSignedUrl: jest.Mock
  getPublicUrl: jest.Mock
}

// Mock user and session data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone: null,
  phone_confirmed_at: null,
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  role: 'authenticated'
}

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser
}

export function createMockSupabaseClient(
  overrides?: {
    user?: Partial<User> | null
    session?: Partial<Session> | null
    isAuthenticated?: boolean
  }
): MockSupabaseClient {
  const { user = mockUser, session = mockSession, isAuthenticated = true } = overrides || {}

  // Create chainable query builder
  const createQueryBuilder = (): MockQueryBuilder => {
    const queryBuilder: MockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      or: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
    }

    // Make all query methods return the builder for chaining
    Object.keys(queryBuilder).forEach(key => {
      if (key !== 'single' && key !== 'maybeSingle') {
        ;(queryBuilder as unknown)[key].mockReturnValue(queryBuilder)
      }
    })

    // Default resolved value for terminal operations but also return 'this' for chaining
    queryBuilder.select.mockImplementation(() => {
      // Store the promise for later resolution
      ;(queryBuilder as unknown).__promise = Promise.resolve({ data: [], error: null })
      // But return the builder for chaining
      return queryBuilder
    })
    
    // Make other operations also support both chaining and promise resolution
    ;['insert', 'update', 'upsert', 'delete'].forEach(method => {
      ;(queryBuilder as unknown)[method].mockImplementation(() => {
        ;(queryBuilder as unknown).__promise = Promise.resolve({ data: null, error: null })
        return queryBuilder
      })
    })

    // Add then/catch to make it thenable
    ;(queryBuilder as unknown).then = function(onFulfilled: unknown, onRejected: unknown) {
      return ((queryBuilder as unknown).__promise || Promise.resolve({ data: null, error: null })).then(onFulfilled, onRejected)
    }
    ;(queryBuilder as unknown).catch = function(onRejected: unknown) {
      return ((queryBuilder as unknown).__promise || Promise.resolve({ data: null, error: null })).catch(onRejected)
    }

    return queryBuilder
  }

  const authStateCallbacks: Array<(event: AuthChangeEvent, session: Session | null) => void> = []

  const supabaseClient: MockSupabaseClient = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: isAuthenticated ? user : null },
        error: isAuthenticated ? null : { message: 'Not authenticated' } as AuthError
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: isAuthenticated ? session : null },
        error: null
      }),
      signIn: jest.fn().mockResolvedValue({
        data: { user, session },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({
        error: null
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user, session },
        error: null
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null
      }),
      onAuthStateChange: jest.fn((callback) => {
        authStateCallbacks.push(callback)
        // Return unsubscribe function
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
          error: null
        }
      })
    },
    from: jest.fn((table: string) => createQueryBuilder()),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: jest.fn((bucket: string) => {
        const storageBucket: MockStorageBucket = {
          upload: jest.fn().mockResolvedValue({
            data: { path: 'mock-path', id: 'mock-id', fullPath: 'mock-full-path' },
            error: null
          }),
          download: jest.fn().mockResolvedValue({
            data: new Blob(['mock-file-content']),
            error: null
          }),
          list: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
          remove: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
          createSignedUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: 'https://mock-signed-url.com' },
            error: null
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://mock-public-url.com' }
          })
        }
        return storageBucket
      })
    }
  }

  return supabaseClient
}

// Helper to trigger auth state changes in tests
export function triggerAuthStateChange(
  client: MockSupabaseClient,
  event: AuthChangeEvent,
  session: Session | null
) {
  const onAuthStateChange = client.auth.onAuthStateChange as unknown
  if (onAuthStateChange.mock.calls.length > 0) {
    onAuthStateChange.mock.calls.forEach((call: unknown) => {
      const callback = call[0]
      callback(event, session)
    })
  }
}

// Pre-configured mock clients for common scenarios
export const authenticatedSupabaseClient = createMockSupabaseClient()
export const unauthenticatedSupabaseClient = createMockSupabaseClient({
  user: null,
  session: null,
  isAuthenticated: false
})