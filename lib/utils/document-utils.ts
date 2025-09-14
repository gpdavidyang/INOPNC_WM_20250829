// 문서 관련 유틸리티 함수들

export interface DocumentCategoryConfig {
  [key: string]: {
    displayName: string
    icon: string
    color: string
    description: string
    allowedFileTypes?: string[]
    maxFileSize?: number
    requiresApproval?: boolean
  }
}

// 문서 카테고리 설정
export const DOCUMENT_CATEGORIES: DocumentCategoryConfig = {
  shared: {
    displayName: '공유문서함',
    icon: 'share',
    color: '#3b82f6',
    description: '모든 사용자가 접근 가능한 공유 문서',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    requiresApproval: false
  },
  markup: {
    displayName: '도면마킹문서함',
    icon: 'edit',
    color: '#10b981',
    description: '도면에 마킹이 된 문서',
    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    requiresApproval: false
  },
  required: {
    displayName: '필수제출서류함',
    icon: 'alert-circle',
    color: '#ef4444',
    description: '필수로 제출해야 하는 서류',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
    requiresApproval: true
  },
  invoice: {
    displayName: '기성청구문서함',
    icon: 'receipt',
    color: '#8b5cf6',
    description: '기성 청구 관련 문서',
    allowedFileTypes: ['pdf', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
    maxFileSize: 30 * 1024 * 1024, // 30MB
    requiresApproval: true
  },
  photo_grid: {
    displayName: '사진대지문서함',
    icon: 'image',
    color: '#f97316',
    description: '사진 대지 관련 문서',
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    requiresApproval: false
  },
  personal: {
    displayName: '개인문서함',
    icon: 'user',
    color: '#6b7280',
    description: '개인 사용자의 문서',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
    requiresApproval: false
  },
  certificate: {
    displayName: '증명서류',
    icon: 'award',
    color: '#eab308',
    description: '각종 증명서 및 인증서',
    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiresApproval: false
  },
  blueprint: {
    displayName: '도면류',
    icon: 'file-text',
    color: '#6366f1',
    description: '설계 도면 및 기술 문서',
    allowedFileTypes: ['pdf', 'dwg', 'jpg', 'jpeg', 'png'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    requiresApproval: false
  },
  report: {
    displayName: '보고서',
    icon: 'bar-chart',
    color: '#ec4899',
    description: '각종 보고서 및 분석 문서',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    maxFileSize: 30 * 1024 * 1024, // 30MB
    requiresApproval: false
  },
  other: {
    displayName: '기타',
    icon: 'folder',
    color: '#9ca3af',
    description: '기타 문서',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
    requiresApproval: false
  }
}

// 파일 확장자에서 MIME 타입 추출
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'dwg': 'application/acad'
  }
  
  return mimeTypes[extension || ''] || 'application/octet-stream'
}

// 파일 크기 검증
export function validateFileSize(file: File, categoryType: string): { valid: boolean; error?: string } {
  const category = DOCUMENT_CATEGORIES[categoryType]
  if (!category || !category.maxFileSize) {
    return { valid: true }
  }
  
  if (file.size > category.maxFileSize) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${formatFileSize(category.maxFileSize)}까지 허용됩니다.`
    }
  }
  
  return { valid: true }
}

// 파일 타입 검증
export function validateFileType(file: File, categoryType: string): { valid: boolean; error?: string } {
  const category = DOCUMENT_CATEGORIES[categoryType]
  if (!category || !category.allowedFileTypes) {
    return { valid: true }
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !category.allowedFileTypes.includes(extension)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. 허용된 형식: ${category.allowedFileTypes.join(', ')}`
    }
  }
  
  return { valid: true }
}

// 문서 카테고리 정보 조회
export function getCategoryInfo(categoryType: string) {
  return DOCUMENT_CATEGORIES[categoryType] || DOCUMENT_CATEGORIES.other
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 날짜 포맷팅
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '오늘'
  } else if (diffDays === 2) {
    return '어제'
  } else if (diffDays <= 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR')
  }
}

// 문서 권한 확인
export function hasDocumentPermission(
  document: UnifiedDocument, 
  userId: string, 
  userRole: string, 
  action: 'view' | 'edit' | 'delete' | 'share'
): boolean {
  // 관리자는 모든 권한
  if (userRole === 'admin') return true
  
  // 문서 소유자는 모든 권한
  if (document.owner_id === userId || document.uploaded_by === userId) return true
  
  // 공개 문서는 조회 가능
  if (action === 'view' && document.is_public) return true
  
  // 감독자는 공개 문서에 대해 편집/공유 가능
  if (userRole === 'supervisor' && document.is_public && ['edit', 'share'].includes(action)) {
    return true
  }
  
  return false
}

// 문서 상태 뱃지 색상
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active': return 'default'
    case 'archived': return 'secondary'
    case 'deleted': return 'destructive'
    case 'rejected': return 'destructive'
    default: return 'outline'
  }
}

// 문서 상태 표시명
export function getStatusDisplayName(status: string): string {
  switch (status) {
    case 'active': return '활성'
    case 'archived': return '보관됨'
    case 'deleted': return '삭제됨'
    case 'rejected': return '거부됨'
    case 'pending': return '승인 대기'
    default: return status
  }
}

// 문서 검색 유틸리티
export function searchDocuments(documents: UnifiedDocument[], query: string): UnifiedDocument[] {
  if (!query.trim()) return documents
  
  const searchTerm = query.toLowerCase()
  
  return documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm) ||
    doc.description?.toLowerCase().includes(searchTerm) ||
    doc.file_name.toLowerCase().includes(searchTerm) ||
    doc.original_filename?.toLowerCase().includes(searchTerm) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}

// 문서 정렬 유틸리티
export function sortDocuments(
  documents: UnifiedDocument[], 
  sortBy: 'created_at' | 'title' | 'file_size', 
  sortOrder: 'asc' | 'desc'
): UnifiedDocument[] {
  return [...documents].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'file_size':
        comparison = (a.file_size || 0) - (b.file_size || 0)
        break
    }
    
    return sortOrder === 'desc' ? -comparison : comparison
  })
}

// 레거시 테이블 매핑 (마이그레이션 중 호환성 유지)
export const LEGACY_TABLE_MAPPING = {
  documents: {
    shared: 'shared',
    personal: 'personal', 
    certificate: 'certificate',
    blueprint: 'blueprint',
    report: 'report',
    other: 'other'
  },
  unified_documents: {
    required_user_docs: 'required'
  },
  markup_documents: {
    shared: 'markup',
    personal: 'markup'
  },
  user_documents: {
    medical_checkup: 'required'
  }
}

// 레거시 문서 타입을 새 카테고리로 변환
export function mapLegacyToCategory(legacyTable: string, legacyType: string): string {
  const mapping = LEGACY_TABLE_MAPPING[legacyTable as keyof typeof LEGACY_TABLE_MAPPING]
  if (mapping && typeof mapping === 'object') {
    return mapping[legacyType as keyof typeof mapping] || 'other'
  }
  return legacyType || 'other'
}

// 카테고리별 기본 메타데이터 생성
export function generateCategoryMetadata(categoryType: string, additionalData?: Record<string, unknown>): Record<string, unknown> {
  const baseMetadata = {
    category_type: categoryType,
    created_via: 'unified_system',
    version: '1.0',
    ...additionalData
  }
  
  switch (categoryType) {
    case 'photo_grid':
      return {
        ...baseMetadata,
        photo_metadata: {
          dimensions: null,
          location: null,
          captured_at: null,
          camera_info: null,
          ...additionalData?.photo_metadata
        }
      }
      
    case 'markup':
      return {
        ...baseMetadata,
        markup_metadata: {
          markup_count: 0,
          last_edited_by: null,
          markup_version: '1.0',
          ...additionalData?.markup_metadata
        }
      }
      
    case 'invoice':
      return {
        ...baseMetadata,
        invoice_metadata: {
          invoice_number: null,
          amount: null,
          due_date: null,
          payment_status: 'pending',
          ...additionalData?.invoice_metadata
        }
      }
      
    case 'required':
      return {
        ...baseMetadata,
        required_metadata: {
          submission_deadline: null,
          approval_status: 'pending',
          reviewer_notes: null,
          ...additionalData?.required_metadata
        }
      }
      
    default:
      return baseMetadata
  }
}

// 업로드 진행률 추적을 위한 유틸리티
export class DocumentUploadTracker {
  private uploads: Map<string, { progress: number; status: 'uploading' | 'processing' | 'complete' | 'error' }> = new Map()
  private listeners: Set<(uploads: Map<string, any>) => void> = new Set()

  startUpload(fileId: string) {
    this.uploads.set(fileId, { progress: 0, status: 'uploading' })
    this.notifyListeners()
  }

  updateProgress(fileId: string, progress: number) {
    const upload = this.uploads.get(fileId)
    if (upload) {
      upload.progress = Math.min(100, Math.max(0, progress))
      this.notifyListeners()
    }
  }

  setProcessing(fileId: string) {
    const upload = this.uploads.get(fileId)
    if (upload) {
      upload.status = 'processing'
      upload.progress = 100
      this.notifyListeners()
    }
  }

  completeUpload(fileId: string) {
    const upload = this.uploads.get(fileId)
    if (upload) {
      upload.status = 'complete'
      upload.progress = 100
      this.notifyListeners()
      
      // 5초 후 제거
      setTimeout(() => {
        this.uploads.delete(fileId)
        this.notifyListeners()
      }, 5000)
    }
  }

  errorUpload(fileId: string) {
    const upload = this.uploads.get(fileId)
    if (upload) {
      upload.status = 'error'
      this.notifyListeners()
    }
  }

  subscribe(listener: (uploads: Map<string, any>) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.uploads)))
  }

  getUploads() {
    return new Map(this.uploads)
  }
}

// 전역 업로드 트래커 인스턴스
export const documentUploadTracker = new DocumentUploadTracker()

// 파일 미리보기 URL 생성
export function generatePreviewUrl(document: UnifiedDocument): string | null {
  if (!document.file_url) return null
  
  // 이미지 파일인 경우 직접 URL 반환
  if (document.mime_type?.startsWith('image/')) {
    return document.file_url
  }
  
  // PDF 파일인 경우 PDF 뷰어 URL 생성
  if (document.mime_type === 'application/pdf') {
    return `/api/unified-documents/${document.id}/preview`
  }
  
  // 마킹 문서인 경우 마킹 뷰어 URL
  if (document.category_type === 'markup' && document.markup_data) {
    return `/markup/${document.id}`
  }
  
  return null
}

// 다운로드 URL 생성
export function generateDownloadUrl(document: UnifiedDocument): string {
  return `/api/unified-documents/${document.id}/download`
}

// 문서 공유 URL 생성
export function generateShareUrl(document: UnifiedDocument): string {
  return `/shared/documents/${document.id}`
}

// 문서 권한 체크 헬퍼
export function canPerformAction(
  document: UnifiedDocument,
  userId: string,
  userRole: string,
  action: 'view' | 'edit' | 'delete' | 'share' | 'approve'
): boolean {
  return hasDocumentPermission(document, userId, userRole, action)
}

// 벌크 작업 검증
export function validateBulkAction(
  action: string,
  documentIds: string[],
  documents: UnifiedDocument[],
  userId: string,
  userRole: string
): { valid: boolean; error?: string } {
  if (documentIds.length === 0) {
    return { valid: false, error: '선택된 문서가 없습니다.' }
  }
  
  const selectedDocs = documents.filter(doc => documentIds.includes(doc.id))
  
  // 권한 검증
  const unauthorizedDocs = selectedDocs.filter(doc => 
    !hasDocumentPermission(doc, userId, userRole, action as unknown)
  )
  
  if (unauthorizedDocs.length > 0) {
    return { 
      valid: false, 
      error: `${unauthorizedDocs.length}개 문서에 대한 ${action} 권한이 없습니다.` 
    }
  }
  
  return { valid: true }
}

// 문서 메타데이터 스키마 검증
export function validateDocumentMetadata(metadata: unknown, categoryType: string): { valid: boolean; error?: string } {
  try {
    // 카테고리별 필수 메타데이터 검증
    switch (categoryType) {
      case 'invoice':
        if (metadata.invoice_metadata) {
          const { invoice_number, amount } = metadata.invoice_metadata
          if (!invoice_number || !amount) {
            return { valid: false, error: '청구서 번호와 금액은 필수입니다.' }
          }
        }
        break
        
      case 'required':
        if (metadata.required_metadata) {
          const { submission_deadline } = metadata.required_metadata
          if (submission_deadline && new Date(submission_deadline) < new Date()) {
            return { valid: false, error: '제출 마감일이 과거 날짜입니다.' }
          }
        }
        break
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: '메타데이터 형식이 올바르지 않습니다.' }
  }
}