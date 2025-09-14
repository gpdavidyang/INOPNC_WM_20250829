# Auth System Migration Guide

## Overview

This guide helps migrate from the old auth system to the new unified auth architecture.

## Migration Status

- ✅ Phase 0: Emergency Stabilization - Complete
- ✅ Phase 1: Auth Service Layer - Complete
- ✅ Phase 2: Auth Provider Abstraction - Complete
- ✅ Phase 3: React Context & Hooks - Complete
- 🔄 Phase 4: Migration & Testing - In Progress
- ⏳ Phase 5: Monitoring & Optimization - Pending

## Current Setup

The application now uses `UnifiedAuthProvider` which provides:

1. **New Auth System** - Modern, testable auth with hooks
2. **Legacy Compatibility** - Maintains backward compatibility
3. **Session Bridging** - SSR/CSR synchronization

## Migration Steps

### Step 1: Update Import Statements

#### Old Imports

```tsx
import { useAuthContext } from '@/providers/auth-provider'
```

#### New Imports

```tsx
// Option 1: Use new auth system (recommended)
import { useAuth } from '@/lib/auth'

// Option 2: Continue using legacy (temporary)
import { useAuthContext } from '@/lib/auth/migration/auth-provider-adapter'
```

### Step 2: Update Component Usage

#### Old Pattern

```tsx
function MyComponent() {
  const { user, session, loading } = useAuthContext()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return <div>Welcome {user.email}</div>
}
```

#### New Pattern

```tsx
import { useAuth, RequireAuth } from '@/lib/auth'

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Not authenticated</div>

  return <div>Welcome {user?.email}</div>
}

// Or use declarative guards
function MyProtectedComponent() {
  return (
    <RequireAuth>
      <MyComponent />
    </RequireAuth>
  )
}
```

### Step 3: Update Permission Checks

#### Old Pattern

```tsx
// Manual role checking
if (user?.role === 'admin') {
  // Show admin content
}
```

#### New Pattern

```tsx
import { usePermissions, PERMISSIONS } from '@/lib/auth'

function AdminPanel() {
  const { hasPermission, canManageUser } = usePermissions()

  if (!hasPermission(PERMISSIONS.SYSTEM_ADMIN)) {
    return <AccessDenied />
  }

  const canEdit = canManageUser('worker')
  // ...
}
```

### Step 4: Update Route Protection

#### Old Pattern (in page.tsx)

```tsx
export default async function Page() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return <PageContent />
}
```

#### New Pattern (client component)

```tsx
'use client'

import { AuthGuard } from '@/lib/auth'

export default function Page() {
  return (
    <AuthGuard requireAuth requireRole="admin">
      <PageContent />
    </AuthGuard>
  )
}
```

### Step 5: Update Auth Actions

#### Old Pattern

```tsx
const supabase = createClient()
await supabase.auth.signInWithPassword({ email, password })
```

#### New Pattern

```tsx
const { signIn } = useAuth()
await signIn({ email, password })
```

## Component Migration Checklist

### Authentication Pages

- [ ] `/auth/login/page.tsx` - Use new `signIn` method
- [ ] `/auth/signup/page.tsx` - Use new `signUp` method
- [ ] `/auth/reset-password/page.tsx` - Use new `resetPassword` method
- [ ] `/auth/signout/route.ts` - Use new `signOut` method

### Dashboard Pages

- [ ] `/dashboard/page.tsx` - Use new `AuthGuard`
- [ ] `/dashboard/admin/*` - Use `RequireRole` component
- [ ] `/mobile/*` - Use permission checks

### API Routes

- [ ] Update session validation
- [ ] Use new permission service
- [ ] Remove direct Supabase auth calls

## Testing Migration

### Check Auth Status

```tsx
import { useAuthMigrationStatus } from '@/lib/auth/migration/auth-provider-adapter'

function MigrationStatus() {
  const status = useAuthMigrationStatus()

  console.log({
    usingNewAuth: status.isUsingNewAuth,
    usingLegacy: status.isUsingLegacyAuth,
    fullyMigrated: status.isFullyMigrated,
    bridged: status.isBridged,
  })
}
```

### Test Checklist

- [ ] Login flow works
- [ ] Logout clears session
- [ ] Protected routes redirect properly
- [ ] Permissions are enforced
- [ ] Session refresh works
- [ ] SSR/CSR sync works

## Benefits After Migration

1. **Better Testing** - Mock provider for tests
2. **Type Safety** - Full TypeScript support
3. **Performance** - Session caching reduces API calls
4. **Security** - Fine-grained permissions
5. **Developer Experience** - Simple hooks and guards
6. **Reliability** - Circuit breaker prevents loops

## Rollback Plan

If issues arise, revert by:

1. Change `UnifiedAuthProvider` back to `AuthProvider` in `components/providers.tsx`
2. Revert import changes in affected components
3. The old auth system remains intact in `/providers/auth-provider.tsx`

## Support

For migration help:

1. Check error logs for `[AUTH-BRIDGE]` messages
2. Use `useAuthMigrationStatus()` to verify setup
3. Test with `USE_MOCK_AUTH=true` for debugging
