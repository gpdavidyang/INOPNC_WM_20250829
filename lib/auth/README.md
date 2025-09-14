# Auth System Documentation

## Overview

This is the new unified authentication system for the INOPNC Work Management application. It provides a clean, testable, and performant authentication layer with support for role-based access control (RBAC), session management, and monitoring.

## Architecture

```
lib/auth/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript types
├── routing.ts                  # Centralized routing logic
├── circuit-breaker.ts          # Prevents redirect loops
│
├── services/
│   ├── auth-service.ts         # Core auth service interface
│   ├── session-manager.ts      # Session caching & management
│   └── permission-service.ts   # RBAC permission checks
│
├── providers/
│   ├── auth-provider.ts        # Provider interface
│   ├── supabase-provider.ts    # Supabase implementation
│   └── mock-provider.ts        # Mock for testing
│
├── context/
│   └── auth-context.tsx        # React Context & Provider
│
├── hooks/
│   ├── use-auth.ts             # Main auth hook
│   └── use-permissions.ts      # Permission checking hook
│
├── components/
│   ├── auth-guard.tsx          # Route protection component
│   ├── require-auth.tsx        # Auth requirement wrapper
│   ├── require-role.tsx        # Role requirement wrapper
│   └── auth-debug-panel.tsx    # Debug panel (dev only)
│
├── migration/
│   ├── auth-provider-adapter.tsx  # Bridge for old system
│   └── MIGRATION_GUIDE.md        # Migration instructions
│
└── monitoring/
    ├── auth-logger.ts          # Event logging
    └── performance-monitor.ts  # Performance tracking
```

## Quick Start

### Basic Usage

```tsx
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return <div>Welcome {user?.email}</div>
}
```

### Protected Routes

```tsx
import { AuthGuard } from '@/lib/auth'

export default function AdminPage() {
  return (
    <AuthGuard requireAuth requireRole="admin">
      <AdminContent />
    </AuthGuard>
  )
}
```

### Permission Checks

```tsx
import { usePermissions, PERMISSIONS } from '@/lib/auth'

function AdminPanel() {
  const { hasPermission, canManageUser } = usePermissions()

  if (!hasPermission(PERMISSIONS.SYSTEM_ADMIN)) {
    return <AccessDenied />
  }

  const canEditWorkers = canManageUser('worker')
  // ...
}
```

## Features

### 🔐 Secure Authentication

- JWT-based session management
- Automatic token refresh
- Secure cookie handling
- CSRF protection

### 🎯 Role-Based Access Control

- Fine-grained permissions
- Role hierarchy support
- Dynamic permission checks
- Resource-based authorization

### ⚡ Performance Optimizations

- Session caching (5-minute TTL)
- Optimistic UI updates
- Lazy loading of auth state
- Circuit breaker for redirect loops

### 🧪 Testing Support

- Mock provider for unit tests
- Integration test utilities
- Isolated auth context
- Deterministic test scenarios

### 📊 Monitoring & Debugging

- Structured event logging
- Performance metrics
- Debug panel (dev mode)
- Error tracking

## API Reference

### useAuth Hook

```typescript
const {
  // State
  user: User | null,
  session: Session | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: Error | null,

  // Actions
  signIn: (credentials) => Promise<AuthResult>,
  signUp: (data) => Promise<AuthResult>,
  signOut: () => Promise<void>,
  resetPassword: (email) => Promise<AuthResult>,
  updatePassword: (newPassword) => Promise<AuthResult>,
  refreshSession: () => Promise<void>,
} = useAuth()
```

### usePermissions Hook

```typescript
const {
  permissions: string[],
  hasPermission: (permission: string) => boolean,
  hasAnyPermission: (permissions: string[]) => boolean,
  hasAllPermissions: (permissions: string[]) => boolean,
  canManageUser: (targetRole: string) => boolean,
  canAccessResource: (resource: string, action: string) => boolean,

  // Convenience checks
  isAdmin: boolean,
  isManager: boolean,
  canCreateUser: boolean,
  canDeleteUser: boolean,
  canManageRoles: boolean,
  canViewReports: boolean,
  canManageProjects: boolean,
} = usePermissions()
```

### AuthGuard Component

```tsx
<AuthGuard
  requireAuth={true} // Require authentication
  requireRole="admin" // Require specific role
  requirePermission="user.create" // Require specific permission
  fallback={<CustomLoader />} // Custom loading component
  redirectTo="/custom-login" // Custom redirect path
>
  <ProtectedContent />
</AuthGuard>
```

## Migration from Old System

### Step 1: Update Imports

```tsx
// Old
import { useAuthContext } from '@/providers/auth-provider'

// New
import { useAuth } from '@/lib/auth'
```

### Step 2: Update Hook Usage

```tsx
// Old
const { user, session, loading } = useAuthContext()

// New
const { user, session, isLoading } = useAuth()
```

### Step 3: Update Auth Actions

```tsx
// Old
await supabase.auth.signInWithPassword({ email, password })

// New
const { signIn } = useAuth()
await signIn({ email, password })
```

## Performance Tips

1. **Use Session Caching**: The session manager caches sessions for 5 minutes
2. **Batch Permission Checks**: Use `hasAllPermissions` for multiple checks
3. **Lazy Load Auth State**: Components only re-render when auth state changes
4. **Use Optimistic Updates**: Update UI before server confirmation

## Debugging

### Enable Debug Panel (Development Only)

```tsx
import { AuthDebugPanel } from '@/lib/auth/components/auth-debug-panel'

function App() {
  return (
    <>
      <YourApp />
      <AuthDebugPanel />
    </>
  )
}
```

### Check Auth Logs

```typescript
import { authLogger } from '@/lib/auth/monitoring/auth-logger'

// Get recent errors
const errors = authLogger.getLogs({ level: LogLevel.ERROR })

// Export all logs
const logData = authLogger.exportLogs()
```

### Monitor Performance

```typescript
import { authPerformanceMonitor } from '@/lib/auth/monitoring/performance-monitor'

// Get performance statistics
const stats = authPerformanceMonitor.getStatistics()
console.log('Average sign-in time:', stats.averageDuration['auth.signIn'])
```

## Security Considerations

1. **Never expose sensitive tokens in client-side code**
2. **Always validate permissions on the server**
3. **Use HTTPS in production**
4. **Implement rate limiting for auth endpoints**
5. **Regular security audits of permissions**

## Support

For issues or questions:

1. Check the migration guide: `/lib/auth/migration/MIGRATION_GUIDE.md`
2. Enable debug panel to inspect auth state
3. Review auth logs for error details
4. Contact the development team

## License

This auth system is part of the INOPNC Work Management application and follows the same license terms.
