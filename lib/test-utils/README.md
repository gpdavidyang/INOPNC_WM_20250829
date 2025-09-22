# Test Utilities

This directory contains comprehensive testing utilities for the INOPNC Work Management System. The utilities are designed to support all recent system changes including the labor hours (공수) system, unified documents UI, PWA features, and Analytics API.

## Directory Structure

```
test-utils/
├── factories/      # Test data factories using faker.js
├── mocks/         # Mock implementations for external dependencies
├── helpers/       # Test helper functions and utilities
├── examples/      # Example test implementations
└── index.ts       # Barrel export for all utilities
```

## Core Mock Framework

### Supabase Client Mock

The `createMockSupabaseClient()` function creates a fully mocked Supabase client that matches the actual Supabase SDK interface.

```typescript
import { createMockSupabaseClient } from '@/lib/test-utils'

// Create authenticated client (default)
const supabase = createMockSupabaseClient()

// Create unauthenticated client
const unauthSupabase = createMockSupabaseClient({
  user: null,
  session: null,
  isAuthenticated: false
})

// Custom user/session
const customSupabase = createMockSupabaseClient({
  user: { ...mockUser, email: 'custom@example.com' }
})
```

#### Features

- **Full Auth Support**: getUser, getSession, signIn, signOut, onAuthStateChange, etc.
- **Chainable Query Builder**: Supports all Supabase query methods with proper chaining
- **Storage Mock**: Upload, download, and URL generation for file storage
- **RPC Support**: Mock RPC function calls
- **TypeScript Support**: Fully typed to match Supabase SDK

#### Example Usage

```typescript
// Auth operations
const { data: { user } } = await supabase.auth.getUser()
const { data: { session } } = await supabase.auth.getSession()

// Database queries
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Storage operations
const bucket = supabase.storage.from('avatars')
const { data: uploadData } = await bucket.upload('avatar.png', file)
const { data: { publicUrl } } = bucket.getPublicUrl('avatar.png')

// RPC calls
const { data: rpcData } = await supabase.rpc('my_function', { param: 'value' })
```

#### Testing Auth State Changes

```typescript
import { triggerAuthStateChange } from '@/lib/test-utils'

// Set up auth state listener
const callback = vi.fn()
supabase.auth.onAuthStateChange(callback)

// Trigger auth state change in test
triggerAuthStateChange(supabase, 'SIGNED_IN', mockSession)
expect(callback).toHaveBeenCalledWith('SIGNED_IN', mockSession)
```

## Coming Soon

### Labor Hours (공수) System Mocks
- `createMockAttendanceWithLaborHours()` - Generate attendance records with labor hours
- `createMockPayslip()` - Generate payslip data with calculations

### Document System Mocks
- `createMockDocument()` - Generate unified document data with card UI fields
- `createMockDailyReport()` - Generate daily report data
- `createMockApprovalDocument()` - Generate approval document data

### PWA Testing Infrastructure
- Service Worker mocks
- Push notification mocks
- Installation state testing

### Analytics Mocks
- Web Vitals mock data
- Analytics event tracking
- Performance metrics

### Test Helpers
- `renderWithProviders()` - Render components with all necessary providers
- `waitForLoadingToFinish()` - Wait for async operations to complete
- `createAuthenticatedUser()` - Create authenticated user context

## Testing Best Practices

1. **Use Mock Factories**: Always use the provided factories to generate test data
2. **Type Safety**: Leverage TypeScript for type-safe mocking
3. **Isolation**: Each test should be independent and not rely on external state
4. **Realistic Data**: Use faker.js to generate realistic test data
5. **Async Handling**: Use proper async utilities for reliable tests

## Migration from Old Test Setup

If you're migrating from the old test setup:

1. Replace manual Supabase mocks with `createMockSupabaseClient()`
2. Use factories instead of hardcoded test data
3. Update imports to use the barrel export from `@/lib/test-utils`
4. Remove redundant mock implementations