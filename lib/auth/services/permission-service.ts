/**
 * Permission Service
 *
 * Centralized authorization and permission management.
 * Handles role-based access control (RBAC) and fine-grained permissions.
 */

import { USER_ROLES, type UserRole } from '../routing'

export interface IPermissionService {
  canAccessRoute(role: string, route: string): boolean
  canPerformAction(role: string, action: string, resource?: string): boolean
  getRolePermissions(role: string): string[]
  hasPermission(role: string, permission: string): boolean
  canManageUser(actorRole: string, targetRole: string): boolean
  canAccessSite(role: string, siteId: string): Promise<boolean>
}

/**
 * Permission definitions for actions and resources
 */
export const PERMISSIONS = {
  // System permissions
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_BACKUP: 'system.backup',

  // User management
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_APPROVE: 'user.approve',

  // Site management
  SITE_CREATE: 'site.create',
  SITE_READ: 'site.read',
  SITE_UPDATE: 'site.update',
  SITE_DELETE: 'site.delete',
  SITE_ASSIGN_WORKER: 'site.assign.worker',
  SITE_ASSIGN_MANAGER: 'site.assign.manager',

  // Daily reports
  REPORT_CREATE: 'report.create',
  REPORT_READ: 'report.read',
  REPORT_UPDATE: 'report.update',
  REPORT_DELETE: 'report.delete',
  REPORT_APPROVE: 'report.approve',
  REPORT_EXPORT: 'report.export',

  // Documents
  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_READ: 'document.read',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_SHARE: 'document.share',
  DOCUMENT_APPROVE: 'document.approve',

  // Salary
  SALARY_VIEW_OWN: 'salary.view.own',
  SALARY_VIEW_ALL: 'salary.view.all',
  SALARY_CALCULATE: 'salary.calculate',
  SALARY_APPROVE: 'salary.approve',
  SALARY_EXPORT: 'salary.export',

  // Materials
  MATERIAL_REQUEST: 'material.request',
  MATERIAL_APPROVE: 'material.approve',
  MATERIAL_MANAGE: 'material.manage',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Mobile specific
  MOBILE_WORKLOG: 'mobile.worklog',
  MOBILE_ATTENDANCE: 'mobile.attendance',
  MOBILE_DOCUMENTS: 'mobile.documents',
  MOBILE_TASKS: 'mobile.tasks',

  // Partner specific
  PARTNER_VIEW: 'partner.view',
  PARTNER_MANAGE: 'partner.manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export class PermissionService implements IPermissionService {
  private readonly rolePermissions: Record<string, string[]> = {
    [USER_ROLES.SYSTEM_ADMIN]: ['*'], // All permissions

    [USER_ROLES.ADMIN]: [
      // System (limited)
      PERMISSIONS.SYSTEM_CONFIG,

      // Full user management
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_APPROVE,

      // Full site management
      PERMISSIONS.SITE_CREATE,
      PERMISSIONS.SITE_READ,
      PERMISSIONS.SITE_UPDATE,
      PERMISSIONS.SITE_DELETE,
      PERMISSIONS.SITE_ASSIGN_WORKER,
      PERMISSIONS.SITE_ASSIGN_MANAGER,

      // Full report management
      PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_UPDATE,
      PERMISSIONS.REPORT_DELETE,
      PERMISSIONS.REPORT_APPROVE,
      PERMISSIONS.REPORT_EXPORT,

      // Full document management
      PERMISSIONS.DOCUMENT_CREATE,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.DOCUMENT_UPDATE,
      PERMISSIONS.DOCUMENT_DELETE,
      PERMISSIONS.DOCUMENT_SHARE,
      PERMISSIONS.DOCUMENT_APPROVE,

      // Full salary management
      PERMISSIONS.SALARY_VIEW_ALL,
      PERMISSIONS.SALARY_CALCULATE,
      PERMISSIONS.SALARY_APPROVE,
      PERMISSIONS.SALARY_EXPORT,

      // Material management
      PERMISSIONS.MATERIAL_APPROVE,
      PERMISSIONS.MATERIAL_MANAGE,

      // Analytics
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT,
    ],

    [USER_ROLES.SITE_MANAGER]: [
      // User (read only)
      PERMISSIONS.USER_READ,

      // Site (limited)
      PERMISSIONS.SITE_READ,
      PERMISSIONS.SITE_ASSIGN_WORKER,

      // Reports (create and manage own site)
      PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_UPDATE,
      PERMISSIONS.REPORT_APPROVE,

      // Documents
      PERMISSIONS.DOCUMENT_CREATE,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.DOCUMENT_UPDATE,
      PERMISSIONS.DOCUMENT_SHARE,

      // Salary (view workers)
      PERMISSIONS.SALARY_VIEW_ALL,

      // Materials
      PERMISSIONS.MATERIAL_REQUEST,
      PERMISSIONS.MATERIAL_APPROVE,

      // Mobile features
      PERMISSIONS.MOBILE_WORKLOG,
      PERMISSIONS.MOBILE_ATTENDANCE,
      PERMISSIONS.MOBILE_DOCUMENTS,
      PERMISSIONS.MOBILE_TASKS,
    ],

    [USER_ROLES.WORKER]: [
      // Reports (read own)
      PERMISSIONS.REPORT_READ,

      // Documents (own)
      PERMISSIONS.DOCUMENT_CREATE,
      PERMISSIONS.DOCUMENT_READ,

      // Salary (own)
      PERMISSIONS.SALARY_VIEW_OWN,

      // Materials (request only)
      PERMISSIONS.MATERIAL_REQUEST,

      // Mobile features
      PERMISSIONS.MOBILE_WORKLOG,
      PERMISSIONS.MOBILE_ATTENDANCE,
      PERMISSIONS.MOBILE_DOCUMENTS,
      PERMISSIONS.MOBILE_TASKS,
    ],

    [USER_ROLES.CUSTOMER_MANAGER]: [
      // Site (read)
      PERMISSIONS.SITE_READ,

      // Reports (read)
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_EXPORT,

      // Documents
      PERMISSIONS.DOCUMENT_READ,

      // Partner features
      PERMISSIONS.PARTNER_VIEW,
      PERMISSIONS.PARTNER_MANAGE,

      // Mobile features
      PERMISSIONS.MOBILE_DOCUMENTS,
    ],

    [USER_ROLES.PARTNER]: [
      // Limited read access
      PERMISSIONS.SITE_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.PARTNER_VIEW,
    ],
  }

  /**
   * Check if a role can access a specific route
   */
  canAccessRoute(role: string, route: string): boolean {
    const permissions = this.rolePermissions[role] || []

    // Check for wildcard permission
    if (permissions.includes('*')) return true

    // Map routes to required permissions
    const routePermissions: Record<string, string[]> = {
      '/dashboard/admin': [PERMISSIONS.SYSTEM_CONFIG],
      '/dashboard/admin/users': [PERMISSIONS.USER_READ],
      '/dashboard/admin/sites': [PERMISSIONS.SITE_READ],
      '/dashboard/admin/reports': [PERMISSIONS.REPORT_READ],
      '/dashboard/admin/salary': [PERMISSIONS.SALARY_VIEW_ALL],
      '/dashboard/admin/analytics': [PERMISSIONS.ANALYTICS_VIEW],
      '/mobile': [PERMISSIONS.MOBILE_WORKLOG],
      '/mobile/worklog': [PERMISSIONS.MOBILE_WORKLOG],
      '/mobile/attendance': [PERMISSIONS.MOBILE_ATTENDANCE],
      '/mobile/documents': [PERMISSIONS.MOBILE_DOCUMENTS],
      '/mobile/tasks': [PERMISSIONS.MOBILE_TASKS],
      '/partner': [PERMISSIONS.PARTNER_VIEW],
    }

    // Check if user has any of the required permissions for the route
    const requiredPerms = routePermissions[route] || []
    if (requiredPerms.length === 0) return true // No specific permission required

    return requiredPerms.some(perm => permissions.includes(perm))
  }

  /**
   * Check if a role can perform a specific action
   */
  canPerformAction(role: string, action: string, resource?: string): boolean {
    const permissions = this.rolePermissions[role] || []

    // Check for wildcard permission
    if (permissions.includes('*')) return true

    // Direct permission check
    if (permissions.includes(action)) return true

    // Check for resource-specific logic
    if (resource) {
      // For example, workers can only view their own salary
      if (action === PERMISSIONS.SALARY_VIEW_OWN && role === USER_ROLES.WORKER) {
        return true
      }
    }

    return false
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: string): string[] {
    return this.rolePermissions[role] || []
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: string, permission: string): boolean {
    const permissions = this.rolePermissions[role] || []
    return permissions.includes('*') || permissions.includes(permission)
  }

  /**
   * Check if one role can manage another role
   */
  canManageUser(actorRole: string, targetRole: string): boolean {
    // System admin can manage everyone
    if (actorRole === USER_ROLES.SYSTEM_ADMIN) return true

    // Admin can manage everyone except system admin
    if (actorRole === USER_ROLES.ADMIN) {
      return targetRole !== USER_ROLES.SYSTEM_ADMIN
    }

    // Site manager can manage workers
    if (actorRole === USER_ROLES.SITE_MANAGER) {
      return targetRole === USER_ROLES.WORKER
    }

    // Others cannot manage users
    return false
  }

  /**
   * Check if a role can access a specific site
   * This would typically check against a database
   */
  async canAccessSite(role: string, siteId: string): Promise<boolean> {
    // System admin and admin can access all sites
    if ([USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ADMIN].includes(role as UserRole)) {
      return true
    }

    // For other roles, we'd need to check site assignments in the database
    // This is a placeholder - actual implementation would query the database
    // For now, return true for simplicity
    return true
  }

  /**
   * Get role hierarchy level (higher number = more permissions)
   */
  getRoleLevel(role: string): number {
    const levels: Record<string, number> = {
      [USER_ROLES.SYSTEM_ADMIN]: 100,
      [USER_ROLES.ADMIN]: 90,
      [USER_ROLES.SITE_MANAGER]: 50,
      [USER_ROLES.CUSTOMER_MANAGER]: 40,
      [USER_ROLES.PARTNER]: 20,
      [USER_ROLES.WORKER]: 10,
    }

    return levels[role] || 0
  }

  /**
   * Compare two roles
   */
  isRoleHigherOrEqual(role1: string, role2: string): boolean {
    return this.getRoleLevel(role1) >= this.getRoleLevel(role2)
  }

  /**
   * Get display name for a permission
   */
  getPermissionDisplayName(permission: string): string {
    const displayNames: Record<string, string> = {
      [PERMISSIONS.SYSTEM_ADMIN]: '시스템 관리자',
      [PERMISSIONS.USER_CREATE]: '사용자 생성',
      [PERMISSIONS.USER_READ]: '사용자 조회',
      [PERMISSIONS.USER_UPDATE]: '사용자 수정',
      [PERMISSIONS.USER_DELETE]: '사용자 삭제',
      [PERMISSIONS.SITE_CREATE]: '현장 생성',
      [PERMISSIONS.SITE_READ]: '현장 조회',
      [PERMISSIONS.REPORT_CREATE]: '보고서 작성',
      [PERMISSIONS.REPORT_APPROVE]: '보고서 승인',
      [PERMISSIONS.SALARY_VIEW_ALL]: '급여 전체 조회',
      [PERMISSIONS.SALARY_VIEW_OWN]: '급여 개인 조회',
      // Add more as needed
    }

    return displayNames[permission] || permission
  }
}

// Export singleton instance
export const permissionService = new PermissionService()
