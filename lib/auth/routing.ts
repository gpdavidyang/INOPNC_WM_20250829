/**
 * Centralized Authentication Routing Configuration
 *
 * Single source of truth for all authentication-related routing logic.
 * This prevents duplicate routing logic and conflicting redirects.
 */

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  RESET_PASSWORD: '/auth/reset-password',
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    PARTNER: '/partner/dashboard',
    MOBILE: '/mobile',
  },
  PUBLIC: {
    HOME: '/',
    ABOUT: '/about',
  },
} as const

/**
 * Role definitions and their associated permissions
 */
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  CUSTOMER_MANAGER: 'customer_manager',
  PARTNER: 'partner',
  SITE_MANAGER: 'site_manager',
  WORKER: 'worker',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Get the appropriate dashboard route based on user role
 * @param role User's role
 * @returns The dashboard route for the given role
 */
export function getRoleBasedRoute(role: string | null | undefined): string {
  const roleRouteMap: Record<string, string> = {
    [USER_ROLES.SYSTEM_ADMIN]: AUTH_ROUTES.DASHBOARD.ADMIN,
    [USER_ROLES.ADMIN]: AUTH_ROUTES.DASHBOARD.ADMIN,
    [USER_ROLES.CUSTOMER_MANAGER]: AUTH_ROUTES.DASHBOARD.PARTNER,
    [USER_ROLES.PARTNER]: AUTH_ROUTES.DASHBOARD.PARTNER,
    [USER_ROLES.WORKER]: AUTH_ROUTES.DASHBOARD.MOBILE,
    [USER_ROLES.SITE_MANAGER]: AUTH_ROUTES.DASHBOARD.MOBILE,
  }

  // Default to admin dashboard if role is unknown
  return roleRouteMap[role || ''] || AUTH_ROUTES.DASHBOARD.ADMIN
}

/**
 * Check if a user role should access mobile interface
 * @param role User's role
 * @returns true if the role should use mobile interface
 */
export function shouldAccessMobile(role: string): boolean {
  const mobileRoles = [USER_ROLES.WORKER, USER_ROLES.SITE_MANAGER, USER_ROLES.CUSTOMER_MANAGER]

  return mobileRoles.includes(role as UserRole)
}

/**
 * Check if a user role should access admin interface
 * @param role User's role
 * @returns true if the role should use admin interface
 */
export function shouldAccessAdmin(role: string): boolean {
  const adminRoles = [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ADMIN]

  return adminRoles.includes(role as UserRole)
}

/**
 * Check if a user role should access partner interface
 * @param role User's role
 * @returns true if the role should use partner interface
 */
export function shouldAccessPartner(role: string): boolean {
  const partnerRoles = [USER_ROLES.CUSTOMER_MANAGER, USER_ROLES.PARTNER]

  return partnerRoles.includes(role as UserRole)
}

/**
 * Get accessible routes for a given role
 * @param role User's role
 * @returns Array of accessible route patterns
 */
export function getAccessibleRoutes(role: string): string[] {
  const routeMap: Record<string, string[]> = {
    [USER_ROLES.SYSTEM_ADMIN]: ['/*'], // Full access
    [USER_ROLES.ADMIN]: ['/dashboard/*', '/api/*'],
    [USER_ROLES.CUSTOMER_MANAGER]: ['/partner/*', '/api/partner/*'],
    [USER_ROLES.PARTNER]: ['/partner/*', '/api/partner/*'],
    [USER_ROLES.SITE_MANAGER]: ['/mobile/*', '/api/mobile/*'],
    [USER_ROLES.WORKER]: ['/mobile/*', '/api/mobile/*'],
  }

  return routeMap[role] || []
}

/**
 * Check if a route is accessible for a given role
 * @param role User's role
 * @param route The route to check
 * @returns true if the route is accessible
 */
export function canAccessRoute(role: string, route: string): boolean {
  const accessibleRoutes = getAccessibleRoutes(role)

  // Check for full access
  if (accessibleRoutes.includes('/*')) return true

  // Check specific routes
  return accessibleRoutes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2)
      return route.startsWith(prefix)
    }
    return pattern === route
  })
}

/**
 * Get the login redirect URL with return path
 * @param returnTo Optional return path after login
 * @returns Login URL with return path query parameter
 */
export function getLoginUrl(returnTo?: string): string {
  if (!returnTo) return AUTH_ROUTES.LOGIN

  const url = new URL(AUTH_ROUTES.LOGIN, 'http://localhost')
  url.searchParams.set('returnTo', returnTo)
  return url.pathname + url.search
}

/**
 * Get the post-login redirect URL
 * @param role User's role
 * @param returnTo Optional return path specified during login
 * @returns The URL to redirect to after successful login
 */
export function getPostLoginRedirect(role: string, returnTo?: string): string {
  // If there's a specific return path and user can access it, use it
  if (returnTo && canAccessRoute(role, returnTo)) {
    return returnTo
  }

  // Otherwise, redirect to role-based dashboard
  return getRoleBasedRoute(role)
}

/**
 * Check if a route is public (doesn't require authentication)
 * @param route The route to check
 * @returns true if the route is public
 */
export function isPublicRoute(route: string): boolean {
  const publicRoutes = [
    AUTH_ROUTES.LOGIN,
    AUTH_ROUTES.RESET_PASSWORD,
    AUTH_ROUTES.PUBLIC.HOME,
    AUTH_ROUTES.PUBLIC.ABOUT,
    '/api/health',
    '/api/public/*',
  ]

  return publicRoutes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2)
      return route.startsWith(prefix)
    }
    return pattern === route
  })
}

/**
 * Check if a route is an auth route (login, logout, etc.)
 * @param route The route to check
 * @returns true if the route is an auth route
 */
export function isAuthRoute(route: string): boolean {
  return route.startsWith('/auth/')
}
