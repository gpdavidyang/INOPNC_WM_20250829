// Core mocks
export {
  createMockSupabaseClient,
  triggerAuthStateChange,
  mockUser,
  mockSession,
  authenticatedSupabaseClient,
  unauthenticatedSupabaseClient,
  type MockSupabaseClient,
  type MockQueryBuilder,
  type MockStorageBucket
} from './mocks/supabase.mock'

// Enhanced auth mocks
export {
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
  type MockAuthResponse,
  type MockCookieStore,
  type MockSupabaseAuthClient
} from './mocks/auth.mock'

// Factories
export * from './factories/attendance.factory'
export * from './factories/documents.factory'
// export * from './factories/daily-reports.factory' (to be implemented)
// export * from './factories/materials.factory' (to be implemented)
// export * from './factories/equipment.factory' (to be implemented)

// Helpers
export * from './helpers/auth-helpers'
export * from './helpers/render-helpers'
export * from './helpers/async-helpers'
export * from './helpers/test-data-builders'

// PWA mocks
export * from './mocks/pwa.mock'
export * from './pwa-setup'

// Analytics mocks
export * from './mocks/analytics.mock'