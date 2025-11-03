/**
 * 문서함별 역할 권한 관리 유틸리티
 */

export type UserRole = 'admin' | 'system_admin' | 'worker' | 'site_manager' | 'customer_manager'
export type DocumentCategory = 'shared' | 'markup' | 'required' | 'invoice' | 'photo_grid'

/**
 * 역할별 접근 가능한 문서함 목록
 */
export const getAccessibleDocumentCategories = (role: UserRole): DocumentCategory[] => {
  switch (role) {
    case 'admin':
    case 'system_admin':
      return ['shared', 'markup', 'required', 'invoice', 'photo_grid']

    case 'worker':
    case 'site_manager':
      return ['shared', 'markup', 'required', 'photo_grid']

    case 'customer_manager':
      return ['shared', 'markup', 'invoice', 'photo_grid']

    default:
      return []
  }
}

/**
 * 특정 문서함에 접근 권한이 있는지 확인
 */
export const canAccessDocumentCategory = (role: UserRole, category: DocumentCategory): boolean => {
  const accessibleCategories = getAccessibleDocumentCategories(role)
  return accessibleCategories.includes(category)
}

/**
 * 문서함별 라벨 정의
 */
export const getDocumentCategoryLabel = (category: DocumentCategory): string => {
  const labels: Record<DocumentCategory, string> = {
    shared: '공유문서함',
    markup: '도면마킹문서함',
    required: '필수제출서류함',
    invoice: '기성청구문서함',
    photo_grid: '사진대지문서함',
  }
  return labels[category]
}

/**
 * 문서함별 URL 경로
 */
export const getDocumentCategoryPath = (category: DocumentCategory): string => {
  const paths: Record<DocumentCategory, string> = {
    shared: '/dashboard/admin/documents/shared',
    markup: '/dashboard/admin/documents/markup',
    required: '/dashboard/admin/documents/required',
    invoice: '/dashboard/admin/documents/invoice',
    photo_grid: '/dashboard/admin/sites?tab=photos',
  }
  return paths[category]
}

/**
 * 역할별 권한 설명
 */
export const getRolePermissionDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    admin: '모든 문서함에 접근하여 전체 데이터를 관리할 수 있습니다',
    system_admin: '모든 문서함에 접근하여 전체 데이터를 관리할 수 있습니다',
    worker: '공유문서, 도면마킹, 필수서류(본인), 사진대지를 볼 수 있습니다',
    site_manager: '공유문서, 도면마킹, 필수서류(본인), 사진대지를 볼 수 있습니다',
    customer_manager: '자사 데이터에 한해 공유문서, 도면마킹, 기성청구, 사진대지를 볼 수 있습니다',
  }
  return descriptions[role] || ''
}

/**
 * 역할별 데이터 필터링 타입
 */
export const getDataFilterType = (role: UserRole): 'all' | 'personal' | 'company' => {
  switch (role) {
    case 'admin':
    case 'system_admin':
      return 'all'

    case 'worker':
    case 'site_manager':
      return 'personal'

    case 'customer_manager':
      return 'company'

    default:
      return 'personal'
  }
}
