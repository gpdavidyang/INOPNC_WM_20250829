/**
 * 문서 관련 API 타입 정의
 */

// 문서 카테고리
export type DocumentCategory = 
  | 'photo_grid'
  | 'markup_document'
  | 'shared_document'
  | 'required_document'
  | 'site_document'
  | 'receipt'
  | 'report'
  | 'contract'
  | 'drawing'
  | 'specification'

// 문서 상태
export type DocumentStatus = 
  | 'draft'
  | 'pending'
  | 'active'
  | 'archived'
  | 'deleted'
  | 'rejected'

// 문서 기본 정보
export interface Document {
  id: string
  title: string
  description?: string | null
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  category_type: DocumentCategory
  status: DocumentStatus
  owner_id: string
  uploaded_by: string
  site_id?: string | null
  daily_report_id?: string | null
  is_public: boolean
  is_archived: boolean
  tags?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 문서 업로드 요청
export interface DocumentUploadRequest {
  file: File
  title: string
  description?: string
  category_type: DocumentCategory
  site_id?: string
  tags?: string[]
  is_public?: boolean
}

// 문서 목록 조회 요청
export interface DocumentListRequest {
  category_type?: DocumentCategory
  status?: DocumentStatus
  site_id?: string
  owner_id?: string
  search?: string
  tags?: string[]
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'file_size'
  sort_order?: 'asc' | 'desc'
}

// 필수 서류 타입
export interface RequiredDocument {
  id: string
  document_type: string
  requirement_name: string
  description?: string
  is_mandatory: boolean
  valid_until?: string | null
  file_format_allowed?: string[]
  max_file_size_mb?: number
  is_active: boolean
}

// 사용자 문서 제출
export interface DocumentSubmission {
  id: string
  user_id: string
  requirement_id: string
  document_id: string
  submission_status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string | null
  reviewed_by?: string | null
  review_comment?: string | null
  expiry_date?: string | null
}

// 문서 권한
export interface DocumentPermission {
  id: string
  document_id: string
  user_id?: string | null
  role?: string | null
  permission_type: 'view' | 'edit' | 'delete' | 'share'
  granted_by: string
  granted_at: string
  expires_at?: string | null
}

// 문서 버전
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_url: string
  file_size: number
  changes_description?: string
  created_by: string
  created_at: string
}

// 문서 코멘트
export interface DocumentComment {
  id: string
  document_id: string
  user_id: string
  comment: string
  parent_comment_id?: string | null
  is_resolved: boolean
  created_at: string
  updated_at: string
}