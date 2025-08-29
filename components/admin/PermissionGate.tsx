'use client'

import { Profile, UserRole } from '@/types'

export type AdminAction = 
  | 'manage_sites'
  | 'manage_users'
  | 'manage_shared_documents'
  | 'manage_salary'
  | 'manage_materials'
  | 'manage_markup'
  | 'manage_system_settings'
  | 'manage_backups'
  | 'view_audit_logs'
  | 'manage_feature_flags'

/**
 * Check if user has system admin privileges
 */
function isSystemAdmin(profile: Profile): boolean {
  return profile?.role === 'system_admin'
}

/**
 * Check if user has admin privileges (admin or system_admin)
 */
function isAdmin(profile: Profile): boolean {
  return profile?.role === 'admin' || profile?.role === 'system_admin'
}

/**
 * Check if user can perform a specific admin action
 */
function canPerformAdminAction(profile: Profile, action: AdminAction): boolean {
  // System admin can do everything
  if (profile?.role === 'system_admin') {
    return true
  }

  // Regular admin restrictions
  if (profile?.role === 'admin') {
    // Restricted actions for regular admin
    const systemAdminOnlyActions: AdminAction[] = [
      'manage_system_settings',
      'manage_backups',
      'view_audit_logs',
      'manage_feature_flags'
    ]
    
    return !systemAdminOnlyActions.includes(action)
  }

  return false
}

interface PermissionGateProps {
  profile: Profile
  /** Required role - will show content if user has this role or higher */
  requiredRole?: 'admin' | 'system_admin'
  /** Required action - will show content if user can perform this action */
  requiredAction?: AdminAction
  /** Content to show when permission is granted */
  children: React.ReactNode
  /** Content to show when permission is denied (optional) */
  fallback?: React.ReactNode
  /** Show loading state while checking permissions */
  loading?: boolean
}

export default function PermissionGate({
  profile,
  requiredRole,
  requiredAction,
  children,
  fallback = null,
  loading = false
}: PermissionGateProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    )
  }

  // Check role-based permission
  if (requiredRole) {
    if (requiredRole === 'system_admin' && !isSystemAdmin(profile)) {
      return <>{fallback}</>
    }
    if (requiredRole === 'admin' && !isAdmin(profile)) {
      return <>{fallback}</>
    }
  }

  // Check action-based permission
  if (requiredAction) {
    if (!canPerformAdminAction(profile, requiredAction)) {
      return <>{fallback}</>
    }
  }

  // If no specific requirements, just check if user is admin
  if (!requiredRole && !requiredAction && !isAdmin(profile)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook to check permissions in components
 */
export const usePermissions = (profile: Profile) => {
  return {
    isAdmin: isAdmin(profile),
    isSystemAdmin: isSystemAdmin(profile),
    canPerform: (action: AdminAction) => canPerformAdminAction(profile, action),
    hasRole: (role: 'admin' | 'system_admin') => {
      if (role === 'system_admin') return isSystemAdmin(profile)
      if (role === 'admin') return isAdmin(profile)
      return false
    }
  }
}