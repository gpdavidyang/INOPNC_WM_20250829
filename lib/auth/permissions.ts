/**
 * 권한 관리 유틸리티 함수들
 * 2025-08-22: admin과 system_admin 권한 통합
 */


/**
 * UI 접근 권한 체크
 */
export const UIAccess = {
  /**
   * 모바일 UI 접근 가능 역할
   */
  isMobileUser: (role: UserRole): boolean => {
    return ['worker', 'site_manager', 'customer_manager'].includes(role)
  },

  /**
   * 데스크탑 UI 접근 가능 역할 (관리자 전용)
   */
  isDesktopUser: (role: UserRole): boolean => {
    return ['admin', 'system_admin'].includes(role)
  }
}

/**
 * 기능별 권한 체크
 */
export const Permissions = {
  /**
   * 전체 시스템 접근 권한 (본사관리자)
   */
  hasFullAccess: (profile: Profile): boolean => {
    return profile.role === 'admin' || profile.role === 'system_admin'
  },

  /**
   * 현장 관리 권한
   */
  canManageSite: (profile: Profile): boolean => {
    return ['admin', 'system_admin', 'site_manager'].includes(profile.role)
  },

  /**
   * 작업일지 수정/삭제 권한
   */
  canEditWorkLogs: (profile: Profile, isOwner: boolean = false): boolean => {
    // 본사관리자는 모든 작업일지 수정 가능
    if (profile.role === 'admin' || profile.role === 'system_admin') return true
    
    // 현장관리자는 자신의 현장 작업일지 수정 가능
    if (profile.role === 'site_manager') return true
    
    // 작업자는 본인 작업일지만 수정 가능
    if (profile.role === 'worker' && isOwner) return true
    
    return false
  },

  /**
   * 사용자 계정 관리 권한
   */
  canManageUsers: (profile: Profile): boolean => {
    return profile.role === 'admin' || profile.role === 'system_admin'
  },

  /**
   * 문서 전체 관리 권한
   */
  canManageAllDocuments: (profile: Profile): boolean => {
    return profile.role === 'admin' || profile.role === 'system_admin'
  },

  /**
   * 알림 시스템 관리 권한
   */
  canManageNotifications: (profile: Profile): boolean => {
    return profile.role === 'admin' || profile.role === 'system_admin'
  },

  /**
   * 시스템 설정 변경 권한
   */
  canChangeSystemSettings: (profile: Profile): boolean => {
    return profile.role === 'admin' || profile.role === 'system_admin'
  },

  /**
   * 읽기 전용 접근 여부
   */
  isReadOnly: (profile: Profile): boolean => {
    return profile.role === 'customer_manager'
  }
}

/**
 * 역할 이름 한글 변환
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    'worker': '작업자',
    'site_manager': '현장관리자',
    'customer_manager': '고객사 관리자',
    'admin': '본사관리자',
    'system_admin': '시스템관리자' // deprecated
  }
  return roleNames[role] || role
}

/**
 * 역할별 설명
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    'worker': '현장 작업자 - 작업일지 작성 및 조회',
    'site_manager': '현장 관리자 - 현장 전체 관리',
    'customer_manager': '고객사 관리자 - 데이터 조회 전용',
    'admin': '본사관리자/시스템관리자 - 전체 시스템 관리',
    'system_admin': '(deprecated - admin으로 통합됨)'
  }
  return descriptions[role] || ''
}

/**
 * 역할별 접근 가능 메뉴 체크
 */
export function canAccessMenu(profile: Profile, menuKey: string): boolean {
  const menuPermissions: Record<string, UserRole[]> = {
    // 공통 메뉴
    'dashboard': ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
    'attendance': ['worker', 'site_manager', 'admin', 'system_admin'],
    'daily-reports': ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
    'documents': ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
    
    // 관리자 메뉴
    'admin': ['admin', 'system_admin'],
    'user-management': ['admin', 'system_admin'],
    'site-management': ['site_manager', 'admin', 'system_admin'],
    'system-settings': ['admin', 'system_admin'],
    'notifications': ['admin', 'system_admin'],
    
    // 현장관리자 메뉴
    'team-management': ['site_manager', 'admin', 'system_admin'],
    'work-approval': ['site_manager', 'admin', 'system_admin'],
    
    // 고객사 메뉴
    'reports': ['customer_manager', 'admin', 'system_admin'],
    'analytics': ['customer_manager', 'admin', 'system_admin'],
  }

  const allowedRoles = menuPermissions[menuKey] || []
  return allowedRoles.includes(profile.role)
}