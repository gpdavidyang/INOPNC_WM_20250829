'use client'

import { useCoreAuth } from '@/providers/core-auth-provider'
import { useProfile } from '@/providers/profile-provider'
import { useRole } from '@/providers/role-provider'

/**
 * useUnifiedAuth - 모든 인증 관련 hooks를 통합한 편의 hook
 * 기존 UnifiedAuthProvider와 100% 호환성 유지
 */
export function useUnifiedAuth() {
  const coreAuth = useCoreAuth()
  const profileData = useProfile()
  const roleData = useRole()

  // 기존 인터페이스와 완전 호환되는 통합 객체 반환
  return {
    // Core auth data
    user: coreAuth.user,
    session: coreAuth.session,
    loading: coreAuth.loading || profileData.loading,
    error: coreAuth.error || profileData.error,

    // Profile data
    profile: profileData.profile,

    // Actions
    signOut: coreAuth.signOut,
    refreshSession: coreAuth.refreshSession,
    refreshProfile: profileData.refreshProfile,

    // Role-based access (완전 호환)
    canAccessMobile: roleData.canAccessMobile,
    canAccessAdmin: roleData.canAccessAdmin,
    isWorker: roleData.isWorker,
    isSiteManager: roleData.isSiteManager,
    isCustomerManager: roleData.isCustomerManager,
    isAdmin: roleData.isAdmin,
    isSystemAdmin: roleData.isSystemAdmin,

    // Mobile-specific features
    getCurrentSite: profileData.getCurrentSite,
    getUserRole: roleData.getUserRole,

    // 추가 편의 기능들
    canManageUsers: roleData.canManageUsers,
    canManageSites: roleData.canManageSites,
    canApproveReports: roleData.canApproveReports,
    canCreateReports: roleData.canCreateReports,
    canViewAllReports: roleData.canViewAllReports,
  }
}

// 기존 hook들과의 호환성을 위한 alias들
export const useAuth = useUnifiedAuth
export const useMobileAuth = useUnifiedAuth
export const useMobileUser = useUnifiedAuth

// 개별 hook들을 원하는 경우를 위한 re-export
export { useCoreAuth } from '@/providers/core-auth-provider'
export { useProfile } from '@/providers/profile-provider'
export { useRole, useRoleCheck, withRole } from '@/providers/role-provider'
