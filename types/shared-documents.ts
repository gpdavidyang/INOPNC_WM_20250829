// =============================================
// 공유문서함 관련 타입 정의
// =============================================

export interface SharedDocument {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type?: string;
  site_id?: string;
  uploaded_by?: string;
  organization_id?: string;
  category?: DocumentCategory;
  tags?: string[];
  version: number;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  site_name?: string;
  site_address?: string;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
  organization_name?: string;
  permission_count?: number;
  view_count?: number;
  download_count?: number;
}

export type DocumentCategory = 
  | '도면'
  | '계약서'
  | '보고서'
  | '사진'
  | 'PTW 작업허가서'
  | '기타';

export interface DocumentPermission {
  id: string;
  document_id: string;
  permission_type: PermissionType;
  target_role?: UserRole;
  target_user_id?: string;
  target_site_id?: string;
  target_organization_id?: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  can_download: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  target_user_name?: string;
  target_user_email?: string;
  target_site_name?: string;
  target_organization_name?: string;
}

export type PermissionType = 
  | 'role_based'
  | 'user_specific'
  | 'site_specific'
  | 'organization_specific';

export type UserRole = 
  | 'worker'
  | 'site_manager'
  | 'partner'
  | 'admin'
  | 'customer_manager';

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: DocumentAction;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type DocumentAction = 
  | 'view'
  | 'download'
  | 'edit'
  | 'delete'
  | 'share'
  | 'upload';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_size: number;
  change_description?: string;
  uploaded_by?: string;
  created_at: string;
  // 조인된 데이터
  uploaded_by_name?: string;
  uploaded_by_email?: string;
}

// =============================================
// 필터링 및 검색 관련 타입
// =============================================

export interface DocumentFilters {
  site_id?: string;
  uploaded_by?: string;
  organization_id?: string;
  category?: DocumentCategory;
  file_type?: string;
  tags?: string[];
  search?: string;
  date_from?: string;
  date_to?: string;
  has_permission?: boolean;
}

export interface DocumentSortOptions {
  field: 'title' | 'created_at' | 'updated_at' | 'file_size' | 'view_count' | 'download_count';
  direction: 'asc' | 'desc';
}

// =============================================
// API 요청/응답 타입
// =============================================

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  file: File;
  site_id?: string;
  organization_id?: string;
  category?: DocumentCategory;
  tags?: string[];
  initial_permissions?: Partial<DocumentPermission>[];
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
  site_id?: string;
  organization_id?: string;
}

export interface ShareDocumentRequest {
  document_id: string;
  permissions: {
    permission_type: PermissionType;
    target_role?: UserRole;
    target_user_id?: string;
    target_site_id?: string;
    target_organization_id?: string;
    can_view?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    can_share?: boolean;
    can_download?: boolean;
    expires_at?: string;
  }[];
}

export interface DocumentListResponse {
  documents: SharedDocument[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// =============================================
// UI 상태 관련 타입
// =============================================

export interface DocumentModalState {
  isOpen: boolean;
  mode: 'upload' | 'edit' | 'view' | 'share' | 'permissions';
  document?: SharedDocument;
}

export interface DocumentUploadState {
  files: File[];
  uploading: boolean;
  progress: number;
  error?: string;
}

// =============================================
// 권한 체크 헬퍼 타입
// =============================================

export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canDownload: boolean;
}

// =============================================
// 파일 타입별 아이콘 매핑
// =============================================

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  ppt: '📽️',
  pptx: '📽️',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  svg: '🖼️',
  dwg: '📐',
  dxf: '📐',
  zip: '📦',
  rar: '📦',
  default: '📎'
};

// =============================================
// 파일 크기 포맷팅 헬퍼
// =============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// =============================================
// MIME 타입 매핑
// =============================================

export const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  // CAD
  'image/vnd.dwg',
  'image/vnd.dxf',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB