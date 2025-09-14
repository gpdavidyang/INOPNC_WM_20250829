/**
 * AuthGuard Component
 *
 * Protects routes and components based on authentication and permissions.
 * Provides loading states and fallback UI.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/auth-context'
import { usePermissions } from '../hooks/use-permissions'
import { AUTH_ROUTES } from '../routing'
import { AuthCircuitBreaker } from '../circuit-breaker'
import type { Permission } from '../services'

/**
 * AuthGuard Props
 */
interface AuthGuardProps {
  children: React.ReactNode

  // Authentication requirements
  requireAuth?: boolean
  requireGuest?: boolean

  // Permission requirements
  requirePermission?: Permission | string
  requireAnyPermission?: (Permission | string)[]
  requireAllPermissions?: (Permission | string)[]

  // Role requirements
  requireRole?: string
  requireAnyRole?: string[]
  allowedRoles?: string[]

  // Route requirements
  requireRouteAccess?: boolean

  // Fallback behavior
  fallback?: React.ReactNode
  redirectTo?: string
  showError?: boolean

  // Loading behavior
  loadingComponent?: React.ReactNode
  suspense?: boolean
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">인증 확인 중...</p>
      </div>
    </div>
  )
}

/**
 * Default access denied component
 */
function DefaultAccessDenied({ message = '접근 권한이 없습니다' }: { message?: string }) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold">접근 거부</h1>
        <p className="text-muted-foreground">{message}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

/**
 * AuthGuard Component
 *
 * @example
 * ```tsx
 * // Require authentication
 * <AuthGuard requireAuth>
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // Require specific permission
 * <AuthGuard requirePermission={PERMISSIONS.USER_CREATE}>
 *   <UserCreateForm />
 * </AuthGuard>
 *
 * // Require specific role
 * <AuthGuard requireRole="admin" redirectTo="/unauthorized">
 *   <AdminPanel />
 * </AuthGuard>
 *
 * // Multiple requirements
 * <AuthGuard
 *   requireAuth
 *   requireAllPermissions={[PERMISSIONS.REPORT_CREATE, PERMISSIONS.REPORT_APPROVE]}
 *   fallback={<CustomErrorPage />}
 * >
 *   <ReportManager />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAuth = false,
  requireGuest = false,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  allowedRoles,
  requireRouteAccess = false,
  fallback,
  redirectTo,
  showError = false,
  loadingComponent,
  suspense = false,
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, isAuthenticated, user } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute } = usePermissions()

  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [denialReason, setDenialReason] = useState<string | null>(null)

  useEffect(() => {
    // Skip check if still loading
    if (isLoading) {
      return
    }

    let allowed = true
    let reason: string | null = null

    // Check authentication requirements
    if (requireAuth && !isAuthenticated) {
      allowed = false
      reason = '로그인이 필요합니다'
    }

    if (requireGuest && isAuthenticated) {
      allowed = false
      reason = '이미 로그인되어 있습니다'
    }

    // Check permission requirements (only if authenticated)
    if (allowed && isAuthenticated) {
      if (requirePermission && !hasPermission(requirePermission)) {
        allowed = false
        reason = '필요한 권한이 없습니다'
      }

      if (requireAnyPermission && !hasAnyPermission(requireAnyPermission)) {
        allowed = false
        reason = '필요한 권한이 없습니다'
      }

      if (requireAllPermissions && !hasAllPermissions(requireAllPermissions)) {
        allowed = false
        reason = '일부 권한이 부족합니다'
      }

      // Check role requirements
      if (requireRole && user?.role !== requireRole) {
        allowed = false
        reason = `'${requireRole}' 역할이 필요합니다`
      }

      if (requireAnyRole && !requireAnyRole.includes(user?.role || '')) {
        allowed = false
        reason = '적절한 역할이 없습니다'
      }

      if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
        allowed = false
        reason = '허용되지 않은 역할입니다'
      }

      // Check route access
      if (requireRouteAccess && !canAccessRoute(pathname)) {
        allowed = false
        reason = '이 페이지에 접근할 수 없습니다'
      }
    }

    setHasAccess(allowed)
    setDenialReason(reason)
    setIsChecking(false)

    // Handle redirect if access denied
    if (!allowed && redirectTo) {
      // Use circuit breaker to prevent redirect loops
      if (AuthCircuitBreaker.checkRedirect(redirectTo)) {
        router.push(redirectTo)
      } else {
        console.error('[AuthGuard] Redirect blocked by circuit breaker')
      }
    } else if (!allowed && requireAuth && !isAuthenticated) {
      // Default redirect to login for unauthenticated users
      const loginUrl = `${AUTH_ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`
      if (AuthCircuitBreaker.checkRedirect(loginUrl)) {
        router.push(loginUrl)
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireAuth,
    requireGuest,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    requireRole,
    requireAnyRole,
    allowedRoles,
    requireRouteAccess,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    pathname,
    router,
    redirectTo,
  ])

  // Show loading state
  if (isLoading || isChecking) {
    if (suspense) {
      // In suspense mode, throw a promise for Suspense boundary
      throw new Promise(() => {})
    }

    return <>{loadingComponent || <DefaultLoadingComponent />}</>
  }

  // Access granted
  if (hasAccess) {
    return <>{children}</>
  }

  // Access denied - show fallback or error
  if (fallback) {
    return <>{fallback}</>
  }

  if (showError) {
    return <DefaultAccessDenied message={denialReason || undefined} />
  }

  // No fallback and not redirecting - render nothing
  return null
}

/**
 * RequireAuth Component
 * Shorthand for requiring authentication
 */
export function RequireAuth({
  children,
  fallback,
  redirectTo,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}) {
  return (
    <AuthGuard requireAuth fallback={fallback} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  )
}

/**
 * RequireGuest Component
 * Shorthand for requiring guest (not authenticated)
 */
export function RequireGuest({
  children,
  fallback,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}) {
  return (
    <AuthGuard requireGuest fallback={fallback} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  )
}

/**
 * RequirePermission Component
 * Shorthand for requiring specific permission
 */
export function RequirePermission({
  children,
  permission,
  fallback,
  showError = true,
}: {
  children: React.ReactNode
  permission: Permission | string
  fallback?: React.ReactNode
  showError?: boolean
}) {
  return (
    <AuthGuard requireAuth requirePermission={permission} fallback={fallback} showError={showError}>
      {children}
    </AuthGuard>
  )
}

/**
 * RequireRole Component
 * Shorthand for requiring specific role
 */
export function RequireRole({
  children,
  role,
  fallback,
  showError = true,
}: {
  children: React.ReactNode
  role: string
  fallback?: React.ReactNode
  showError?: boolean
}) {
  return (
    <AuthGuard requireAuth requireRole={role} fallback={fallback} showError={showError}>
      {children}
    </AuthGuard>
  )
}
