'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useProfile } from './profile-provider'

/**
 * RoleProvider - 역할 기반 접근 제어
 * 책임: 역할 기반 권한 계산, 접근 제어 로직
 */
interface RoleContextType {
  role: string | null
  canAccessMobile: boolean
  canAccessAdmin: boolean
  isWorker: boolean
  isSiteManager: boolean
  isCustomerManager: boolean
  isAdmin: boolean
  isSystemAdmin: boolean
  getUserRole: () => string | null
  // 추가 권한 헬퍼들
  canManageUsers: boolean
  canManageSites: boolean
  canApproveReports: boolean
  canCreateReports: boolean
  canViewAllReports: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: React.ReactNode
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { profile } = useProfile()

  // 모든 역할 기반 계산을 useMemo로 최적화
  const roleData = useMemo(() => {
    const role = profile?.role || null

    // 기본 역할 체크
    const isWorker = role === 'worker'
    const isSiteManager = role === 'site_manager'
    const isCustomerManager = role === 'customer_manager'
    const isAdmin = role === 'admin'
    const isSystemAdmin = role === 'system_admin'

    // 계층적 권한 체크
    const canAccessMobile = !!(
      role && ['worker', 'site_manager', 'customer_manager'].includes(role)
    )
    const canAccessAdmin = !!(role && ['admin', 'system_admin'].includes(role))

    // 상세 권한 계산
    const canManageUsers = isAdmin || isSystemAdmin
    const canManageSites = isAdmin || isSystemAdmin
    const canApproveReports = isSiteManager || isAdmin || isSystemAdmin
    const canCreateReports = isWorker || isSiteManager || isAdmin || isSystemAdmin
    const canViewAllReports = isAdmin || isSystemAdmin || isCustomerManager

    const getUserRole = () => role

    return {
      role,
      canAccessMobile,
      canAccessAdmin,
      isWorker,
      isSiteManager,
      isCustomerManager,
      isAdmin,
      isSystemAdmin,
      getUserRole,
      canManageUsers,
      canManageSites,
      canApproveReports,
      canCreateReports,
      canViewAllReports,
    }
  }, [profile?.role])

  return <RoleContext.Provider value={roleData}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// 편의를 위한 추가 hooks
export function useRoleCheck() {
  const { role } = useRole()

  return {
    hasRole: (requiredRole: string) => role === requiredRole,
    hasAnyRole: (requiredRoles: string[]) => (role ? requiredRoles.includes(role) : false),
    hasMinimumRole: (minimumRole: string) => {
      if (!role) return false

      const roleHierarchy = ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
      const userRoleLevel = roleHierarchy.indexOf(role)
      const minimumRoleLevel = roleHierarchy.indexOf(minimumRole)

      return userRoleLevel >= minimumRoleLevel
    },
  }
}

// HOC for role-based component rendering
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRoles?: string[]
    fallback?: React.ComponentType<any>
    minimumRole?: string
  }
) {
  return function RoleProtectedComponent(props: P) {
    const { role } = useRole()
    const { hasAnyRole, hasMinimumRole } = useRoleCheck()

    // Check role requirements
    let hasAccess = true

    if (options.requiredRoles) {
      hasAccess = hasAnyRole(options.requiredRoles)
    } else if (options.minimumRole) {
      hasAccess = hasMinimumRole(options.minimumRole)
    }

    if (!hasAccess) {
      if (options.fallback) {
        return <options.fallback />
      }
      return null
    }

    return <Component {...props} />
  }
}
