/**
 * PermissionService Unit Tests
 */

import { PermissionService, PERMISSIONS } from '../permission-service'
import { USER_ROLES } from '../../routing'

describe('PermissionService', () => {
  let permissionService: PermissionService

  beforeEach(() => {
    permissionService = new PermissionService()
  })

  describe('canAccessRoute', () => {
    it('should allow system admin to access any route', () => {
      const canAccess = permissionService.canAccessRoute(
        USER_ROLES.SYSTEM_ADMIN,
        '/dashboard/admin'
      )
      expect(canAccess).toBe(true)

      const canAccessMobile = permissionService.canAccessRoute(USER_ROLES.SYSTEM_ADMIN, '/mobile')
      expect(canAccessMobile).toBe(true)
    })

    it('should allow admin to access admin routes', () => {
      const canAccess = permissionService.canAccessRoute(USER_ROLES.ADMIN, '/dashboard/admin/users')
      expect(canAccess).toBe(true)
    })

    it('should allow site manager to access mobile routes', () => {
      const canAccess = permissionService.canAccessRoute(USER_ROLES.SITE_MANAGER, '/mobile/worklog')
      expect(canAccess).toBe(true)
    })

    it('should deny worker access to admin routes', () => {
      const canAccess = permissionService.canAccessRoute(USER_ROLES.WORKER, '/dashboard/admin')
      expect(canAccess).toBe(false)
    })

    it('should allow worker to access mobile routes', () => {
      const canAccess = permissionService.canAccessRoute(USER_ROLES.WORKER, '/mobile/attendance')
      expect(canAccess).toBe(true)
    })

    it('should allow customer manager to access partner routes', () => {
      const canAccess = permissionService.canAccessRoute(USER_ROLES.CUSTOMER_MANAGER, '/partner')
      expect(canAccess).toBe(true)
    })
  })

  describe('canPerformAction', () => {
    it('should allow system admin to perform any action', () => {
      const canCreate = permissionService.canPerformAction(
        USER_ROLES.SYSTEM_ADMIN,
        PERMISSIONS.USER_CREATE
      )
      expect(canCreate).toBe(true)

      const canDelete = permissionService.canPerformAction(
        USER_ROLES.SYSTEM_ADMIN,
        PERMISSIONS.SITE_DELETE
      )
      expect(canDelete).toBe(true)
    })

    it('should allow admin to manage users', () => {
      const canCreate = permissionService.canPerformAction(
        USER_ROLES.ADMIN,
        PERMISSIONS.USER_CREATE
      )
      expect(canCreate).toBe(true)

      const canDelete = permissionService.canPerformAction(
        USER_ROLES.ADMIN,
        PERMISSIONS.USER_DELETE
      )
      expect(canDelete).toBe(true)
    })

    it('should allow site manager to approve reports', () => {
      const canApprove = permissionService.canPerformAction(
        USER_ROLES.SITE_MANAGER,
        PERMISSIONS.REPORT_APPROVE
      )
      expect(canApprove).toBe(true)
    })

    it('should deny worker from approving reports', () => {
      const canApprove = permissionService.canPerformAction(
        USER_ROLES.WORKER,
        PERMISSIONS.REPORT_APPROVE
      )
      expect(canApprove).toBe(false)
    })

    it('should allow worker to view own salary', () => {
      const canView = permissionService.canPerformAction(
        USER_ROLES.WORKER,
        PERMISSIONS.SALARY_VIEW_OWN
      )
      expect(canView).toBe(true)
    })

    it('should deny worker from viewing all salaries', () => {
      const canViewAll = permissionService.canPerformAction(
        USER_ROLES.WORKER,
        PERMISSIONS.SALARY_VIEW_ALL
      )
      expect(canViewAll).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('should return all permissions for system admin', () => {
      const permissions = permissionService.getRolePermissions(USER_ROLES.SYSTEM_ADMIN)
      expect(permissions).toEqual(['*'])
    })

    it('should return specific permissions for admin', () => {
      const permissions = permissionService.getRolePermissions(USER_ROLES.ADMIN)
      expect(permissions).toContain(PERMISSIONS.USER_CREATE)
      expect(permissions).toContain(PERMISSIONS.SITE_MANAGE)
      expect(permissions).toContain(PERMISSIONS.REPORT_APPROVE)
    })

    it('should return limited permissions for worker', () => {
      const permissions = permissionService.getRolePermissions(USER_ROLES.WORKER)
      expect(permissions).toContain(PERMISSIONS.MOBILE_WORKLOG)
      expect(permissions).toContain(PERMISSIONS.SALARY_VIEW_OWN)
      expect(permissions).not.toContain(PERMISSIONS.USER_CREATE)
    })

    it('should return empty array for unknown role', () => {
      const permissions = permissionService.getRolePermissions('unknown_role')
      expect(permissions).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('should return true for system admin with any permission', () => {
      const hasPermission = permissionService.hasPermission(
        USER_ROLES.SYSTEM_ADMIN,
        PERMISSIONS.USER_DELETE
      )
      expect(hasPermission).toBe(true)
    })

    it('should return true for role with specific permission', () => {
      const hasPermission = permissionService.hasPermission(
        USER_ROLES.ADMIN,
        PERMISSIONS.USER_CREATE
      )
      expect(hasPermission).toBe(true)
    })

    it('should return false for role without permission', () => {
      const hasPermission = permissionService.hasPermission(
        USER_ROLES.WORKER,
        PERMISSIONS.USER_DELETE
      )
      expect(hasPermission).toBe(false)
    })
  })

  describe('canManageUser', () => {
    it('should allow system admin to manage any role', () => {
      expect(permissionService.canManageUser(USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ADMIN)).toBe(true)
      expect(permissionService.canManageUser(USER_ROLES.SYSTEM_ADMIN, USER_ROLES.WORKER)).toBe(true)
    })

    it('should allow admin to manage all except system admin', () => {
      expect(permissionService.canManageUser(USER_ROLES.ADMIN, USER_ROLES.SITE_MANAGER)).toBe(true)
      expect(permissionService.canManageUser(USER_ROLES.ADMIN, USER_ROLES.WORKER)).toBe(true)
      expect(permissionService.canManageUser(USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN)).toBe(false)
    })

    it('should allow site manager to manage workers only', () => {
      expect(permissionService.canManageUser(USER_ROLES.SITE_MANAGER, USER_ROLES.WORKER)).toBe(true)
      expect(permissionService.canManageUser(USER_ROLES.SITE_MANAGER, USER_ROLES.ADMIN)).toBe(false)
    })

    it('should deny workers from managing anyone', () => {
      expect(permissionService.canManageUser(USER_ROLES.WORKER, USER_ROLES.WORKER)).toBe(false)
    })
  })

  describe('canAccessSite', () => {
    it('should allow system admin to access any site', async () => {
      const canAccess = await permissionService.canAccessSite(USER_ROLES.SYSTEM_ADMIN, 'site-123')
      expect(canAccess).toBe(true)
    })

    it('should allow admin to access any site', async () => {
      const canAccess = await permissionService.canAccessSite(USER_ROLES.ADMIN, 'site-456')
      expect(canAccess).toBe(true)
    })

    // Note: Other roles would need database checks in real implementation
    it('should check site assignment for other roles', async () => {
      // This is a placeholder test - actual implementation would query database
      const canAccess = await permissionService.canAccessSite(USER_ROLES.SITE_MANAGER, 'site-789')
      expect(canAccess).toBe(true) // Currently returns true for all
    })
  })

  describe('getRoleLevel', () => {
    it('should return correct hierarchy levels', () => {
      expect(permissionService.getRoleLevel(USER_ROLES.SYSTEM_ADMIN)).toBe(100)
      expect(permissionService.getRoleLevel(USER_ROLES.ADMIN)).toBe(90)
      expect(permissionService.getRoleLevel(USER_ROLES.SITE_MANAGER)).toBe(50)
      expect(permissionService.getRoleLevel(USER_ROLES.CUSTOMER_MANAGER)).toBe(40)
      expect(permissionService.getRoleLevel(USER_ROLES.PARTNER)).toBe(20)
      expect(permissionService.getRoleLevel(USER_ROLES.WORKER)).toBe(10)
      expect(permissionService.getRoleLevel('unknown')).toBe(0)
    })
  })

  describe('isRoleHigherOrEqual', () => {
    it('should correctly compare role hierarchy', () => {
      expect(permissionService.isRoleHigherOrEqual(USER_ROLES.ADMIN, USER_ROLES.WORKER)).toBe(true)
      expect(permissionService.isRoleHigherOrEqual(USER_ROLES.WORKER, USER_ROLES.ADMIN)).toBe(false)
      expect(permissionService.isRoleHigherOrEqual(USER_ROLES.ADMIN, USER_ROLES.ADMIN)).toBe(true)
    })
  })

  describe('getPermissionDisplayName', () => {
    it('should return Korean display names for permissions', () => {
      expect(permissionService.getPermissionDisplayName(PERMISSIONS.USER_CREATE)).toBe(
        '사용자 생성'
      )
      expect(permissionService.getPermissionDisplayName(PERMISSIONS.REPORT_APPROVE)).toBe(
        '보고서 승인'
      )
    })

    it('should return permission key if no display name exists', () => {
      expect(permissionService.getPermissionDisplayName('unknown.permission')).toBe(
        'unknown.permission'
      )
    })
  })
})
