/**
 * usePermissions Hook
 *
 * Provides convenient permission checking in React components.
 * Uses the auth context and permission service.
 */

'use client'

import { useMemo, useCallback } from 'react'
import { useAuth } from '../context/auth-context'
import { permissionService, PERMISSIONS, type Permission } from '../services'

/**
 * Permission check result
 */
interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * usePermissions Hook Return Type
 */
interface UsePermissionsReturn {
  // Current user role
  role: string | null

  // Permission checks
  hasPermission: (permission: Permission | string) => boolean
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean
  hasAllPermissions: (permissions: (Permission | string)[]) => boolean

  // Route access
  canAccessRoute: (route: string) => boolean

  // User management
  canManageUser: (targetRole: string) => boolean

  // Batch permission check
  checkPermissions: (permissions: (Permission | string)[]) => Record<string, boolean>

  // Advanced checks with reasons
  checkPermissionWithReason: (permission: Permission | string) => PermissionCheckResult

  // Role hierarchy
  isRoleHigherOrEqual: (targetRole: string) => boolean
  getRoleLevel: () => number

  // Get all permissions for current role
  getAllPermissions: () => string[]
}

/**
 * usePermissions Hook
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { hasPermission, canManageUser } = usePermissions()
 *
 *   if (!hasPermission(PERMISSIONS.SYSTEM_ADMIN)) {
 *     return <AccessDenied />
 *   }
 *
 *   const canEditUser = canManageUser('worker')
 *   // ...
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth()
  const role = user?.role || null

  /**
   * Check single permission
   */
  const hasPermission = useCallback(
    (permission: Permission | string): boolean => {
      if (!role) return false
      return permissionService.hasPermission(role, permission)
    },
    [role]
  )

  /**
   * Check if user has any of the provided permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: (Permission | string)[]): boolean => {
      if (!role) return false
      return permissions.some(permission => permissionService.hasPermission(role, permission))
    },
    [role]
  )

  /**
   * Check if user has all of the provided permissions
   */
  const hasAllPermissions = useCallback(
    (permissions: (Permission | string)[]): boolean => {
      if (!role) return false
      return permissions.every(permission => permissionService.hasPermission(role, permission))
    },
    [role]
  )

  /**
   * Check route access
   */
  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!role) return false
      return permissionService.canAccessRoute(role, route)
    },
    [role]
  )

  /**
   * Check user management permission
   */
  const canManageUser = useCallback(
    (targetRole: string): boolean => {
      if (!role) return false
      return permissionService.canManageUser(role, targetRole)
    },
    [role]
  )

  /**
   * Batch check permissions
   */
  const checkPermissions = useCallback(
    (permissions: (Permission | string)[]): Record<string, boolean> => {
      const results: Record<string, boolean> = {}

      permissions.forEach(permission => {
        results[permission] = hasPermission(permission)
      })

      return results
    },
    [hasPermission]
  )

  /**
   * Check permission with detailed reason
   */
  const checkPermissionWithReason = useCallback(
    (permission: Permission | string): PermissionCheckResult => {
      if (!role) {
        return {
          allowed: false,
          reason: 'User is not authenticated',
        }
      }

      const allowed = permissionService.hasPermission(role, permission)

      if (!allowed) {
        return {
          allowed: false,
          reason: `Role '${role}' does not have permission '${permission}'`,
        }
      }

      return {
        allowed: true,
      }
    },
    [role]
  )

  /**
   * Check if current role is higher or equal to target
   */
  const isRoleHigherOrEqual = useCallback(
    (targetRole: string): boolean => {
      if (!role) return false
      return permissionService.isRoleHigherOrEqual(role, targetRole)
    },
    [role]
  )

  /**
   * Get role hierarchy level
   */
  const getRoleLevel = useCallback((): number => {
    if (!role) return 0
    return permissionService.getRoleLevel(role)
  }, [role])

  /**
   * Get all permissions for current role
   */
  const getAllPermissions = useCallback((): string[] => {
    if (!role) return []
    return permissionService.getRolePermissions(role)
  }, [role])

  return useMemo(
    () => ({
      role,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute,
      canManageUser,
      checkPermissions,
      checkPermissionWithReason,
      isRoleHigherOrEqual,
      getRoleLevel,
      getAllPermissions,
    }),
    [
      role,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute,
      canManageUser,
      checkPermissions,
      checkPermissionWithReason,
      isRoleHigherOrEqual,
      getRoleLevel,
      getAllPermissions,
    ]
  )
}

/**
 * Permission constants re-export for convenience
 */
export { PERMISSIONS } from '../services'
