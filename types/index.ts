// 사용자 역할
// - worker: 작업자 (모바일 UI)
// - site_manager: 현장관리자 (모바일 UI)
// - customer_manager: 고객사 관리자 (모바일 UI)
// - admin: 본사관리자/시스템관리자 (데스크탑 UI) - 전체 시스템 접근 권한
// - system_admin: (deprecated - admin으로 통합)
export type UserRole = 'worker' | 'site_manager' | 'customer_manager' | 'admin' | 'system_admin'

// 사용자 상태
export type UserStatus = 'active' | 'inactive' | 'suspended'

// 사용자 프로필
export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  status?: UserStatus | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
  last_login_at?: string | null
  login_count?: number | null
  notification_preferences?: {
    push_enabled?: boolean
    material_approvals?: boolean
    daily_report_reminders?: boolean
    safety_alerts?: boolean
    equipment_maintenance?: boolean
    site_announcements?: boolean
    quiet_hours_enabled?: boolean
    quiet_hours_start?: string
    quiet_hours_end?: string
    sound_enabled?: boolean
    vibration_enabled?: boolean
    show_previews?: boolean
    group_notifications?: boolean
  } | null
  push_subscription?: any | null
  push_subscription_updated_at?: string | null
}

// 건설 공정 타입 (사용자 요구사항에 맞춤)
export type ConstructionProcessType =
  | 'crack' // 균열
  | 'surface' // 면
  | 'finishing' // 마감
  | 'other' // 기타

// 부재 타입 (사용자 요구사항에 맞춤)
export type ComponentType =
  | 'slab' // 슬라브
  | 'girder' // 거더
  | 'column' // 기둥
  | 'other' // 기타

// 작업 옵션 설정 타입
export interface WorkOptionSetting {
  id: string
  option_type: 'component_type' | 'process_type'
  option_value: string
  option_label: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// 건설 사진 데이터
export interface ConstructionPhoto {
  id: string
  component_name: string // 부재명 (예: "기둥-1", "보-A동", "슬라브-3층")
  component_type: ComponentType
  process_type: ConstructionProcessType
  stage: 'before' | 'after'
  file_url: string
  thumbnail_url?: string
  description?: string
  coordinates?: { x: number; y: number }
  timestamp: string
  file_size?: number
  file_name?: string
  daily_report_id?: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

// 사진 그룹 (동일 부재/공정의 전후 사진 묶음)
export interface PhotoGroup {
  id: string
  component_name: string
  component_type: ComponentType
  process_type: ConstructionProcessType
  before_photos: ConstructionPhoto[]
  after_photos: ConstructionPhoto[]
  progress_status: 'not_started' | 'in_progress' | 'completed'
  notes?: string
  daily_report_id: string
  created_at: string
  updated_at: string
}

// 사진 업로드 진행률
export interface PhotoProgress {
  component_name: string
  component_type: ComponentType
  processes: {
    process_type: ConstructionProcessType
    has_before: boolean
    has_after: boolean
    completed: boolean
  }[]
  overall_progress: number // 0-100%
}

// 조직
export interface Organization {
  id: string
  name: string
  parent_id?: string | null
  description?: string | null
  address?: string | null
  phone?: string | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

// 현장 상태
export type SiteStatus = 'active' | 'inactive' | 'completed'

// 현장
export interface Site {
  id: string
  name: string
  address: string
  description?: string | null
  manager_phone?: string | null // 현장 담당자 연락처 (통일)
  manager_email?: string | null // 현장 담당자 이메일 (통일)
  construction_manager_phone?: string | null // [legacy] 호환용
  construction_manager_email?: string | null // [legacy] 호환용
  safety_manager_phone?: string | null
  accommodation_name?: string | null
  accommodation_address?: string | null
  // 확장된 현장 정보
  work_process?: string | null // 작업공정 (예: 슬라브 타설, 철근 배근 등)
  work_section?: string | null // 작업구간 (예: 지하 1층, B동 3층 등)
  component_name?: string | null // 부재명 (예: 기둥 C1-C5 구간)
  manager_name?: string | null // 현장 책임자 이름
  safety_manager_name?: string | null // 안전관리자 이름
  status?: SiteStatus | null
  start_date: string
  end_date?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

// 현장 배정 역할
export type SiteAssignmentRole = 'worker' | 'site_manager' | 'supervisor'

// 현장 배정
export interface SiteAssignment {
  id: string
  site_id: string
  user_id: string
  assigned_date: string
  unassigned_date?: string | null
  role?: SiteAssignmentRole | null
  is_active: boolean
  created_at: string
  updated_at: string
  // 조인된 정보
  site?: Site
  profile?: Profile
}

// 현재 사용자 현장 정보 (DB 함수 반환 타입)
export interface CurrentUserSite {
  site_id: string
  site_name: string
  site_address: string
  work_process?: string | null
  work_section?: string | null
  component_name?: string | null
  manager_name?: string | null
  manager_phone?: string | null
  construction_manager_phone?: string | null // [legacy] 호환용
  safety_manager_name?: string | null
  safety_manager_phone?: string | null
  accommodation_name?: string | null
  accommodation_address?: string | null
  assigned_date: string
  user_role: SiteAssignmentRole
  site_status: SiteStatus
  start_date: string
  end_date?: string | null
  // Document fields
  ptw_document_id?: string | null
  ptw_document_title?: string | null
  ptw_document_url?: string | null
  ptw_document_filename?: string | null
  ptw_document_mime_type?: string | null
  blueprint_document_id?: string | null
  blueprint_document_title?: string | null
  blueprint_document_url?: string | null
  blueprint_document_filename?: string | null
  blueprint_document_mime_type?: string | null
}

// 사용자 현장 이력 (DB 함수 반환 타입)
export interface UserSiteHistory {
  site_id: string
  site_name: string
  site_address: string
  work_process?: string | null
  work_section?: string | null
  assigned_date: string
  unassigned_date?: string | null
  user_role: SiteAssignmentRole
  site_status: SiteStatus
  start_date: string
  end_date?: string | null
  is_active: boolean
}

// 파트너사 (협력업체)
export interface PartnerCompany {
  id: string
  company_name: string
  business_number?: string | null
  company_type?: 'general_contractor' | 'subcontractor' | 'supplier' | 'consultant' | null
  trade_type?: string[] | null
  representative_name?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  bank_name?: string | null
  bank_account?: string | null
  credit_rating?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  status?: 'active' | 'inactive' | 'terminated' | null
  notes?: string | null
  organization_id?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

// 현장-파트너사 연결
export interface SitePartner {
  id: string
  site_id: string
  partner_company_id: string
  contract_amount?: number | null
  work_scope?: string | null
  start_date: string
  end_date?: string | null
  status?: 'active' | 'completed' | 'terminated' | null
  created_at: string
  updated_at: string
  // Join된 데이터
  partner_company?: PartnerCompany | null
  site?: Site | null
}

// 작업일지 상태
export type DailyReportStatus = 'draft' | 'submitted' | 'completed'

// 작업일지
export interface DailyReport {
  id: string
  site_id?: string | null
  partner_company_id?: string | null // 파트너사 ID 추가
  work_date: string
  member_name: string // 부재명 (슬라브, 거더, 기둥, 기타)
  process_type: string // 공정 (균열, 면, 마감, 기타)
  total_workers?: number | null
  npc1000_incoming?: number | null
  npc1000_used?: number | null
  npc1000_remaining?: number | null
  issues?: string | null
  status?: DailyReportStatus | null
  created_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  created_at: string
  updated_at: string
  // 사진대지 PDF 정보
  has_photo_grid_pdf?: boolean | null
  photo_grid_pdf_count?: number | null
  // Join된 데이터
  site?: {
    id: string
    name: string
  } | null
  partner_company?: {
    id: string
    company_name: string
  } | null
  photo_grid_reports?: PhotoGridReport[] | null
}

// 작업자별 공수
export interface DailyReportWorker {
  id: string
  daily_report_id?: string | null
  worker_name: string
  work_hours: number
  created_at: string
}

// 출근 상태
export type AttendanceStatus = 'present' | 'absent' | 'holiday' | 'sick_leave' | 'vacation'

// 출근 기록
export interface AttendanceRecord {
  id: string
  user_id?: string | null
  site_id?: string | null
  work_date: string
  date?: string // Added for client compatibility (same as work_date)
  check_in_time?: string | null
  check_out_time?: string | null
  work_hours?: number | null
  overtime_hours?: number | null
  labor_hours?: number | null // 공수 (1.0 = 8 hours)
  status?: AttendanceStatus | null
  notes?: string | null
  created_at: string
  updated_at: string
  // Joined fields from server actions
  sites?: {
    id: string
    name: string
  } | null
  site_name?: string // Computed field for display
}

// 문서 타입
export type DocumentType =
  | 'personal'
  | 'shared'
  | 'blueprint'
  | 'required'
  | 'progress_payment'
  | 'report'
  | 'certificate'
  | 'other'

// 필수 문서 제출 상태
export type RequiredDocumentStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

// 필수 문서 타입
export type RequiredDocumentType =
  | 'identity_verification' // 신분증명서
  | 'health_certificate' // 건강진단서
  | 'safety_education' // 안전교육증명서
  | 'insurance_certificate' // 보험증서
  | 'employment_contract' // 고용계약서
  | 'bank_account' // 통장사본
  | 'emergency_contact' // 비상연락처
  | 'other' // 기타

// 사용자 필수 문서 제출 현황
export interface UserRequiredDocument {
  id: string
  user_id: string
  document_type: RequiredDocumentType
  status: RequiredDocumentStatus
  document_id?: string | null
  submitted_at?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_notes?: string | null
  expires_at?: string | null
  is_required: boolean
  created_at: string
  updated_at: string
  // 조인된 정보
  document?: Document | null
  reviewer?: Profile | null
}

// 사이트 문서 타입 (새로운 site_documents 테이블용)
export type SiteDocumentType = 'ptw' | 'blueprint' | 'progress_drawing' | 'other'

// 문서
export interface Document {
  id: string
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size?: number | null
  mime_type?: string | null
  document_type?: DocumentType | null
  folder_path?: string | null
  owner_id?: string | null
  is_public?: boolean | null
  site_id?: string | null
  created_at: string
  updated_at: string
  metadata?: any | null
  is_deleted?: boolean | null
  created_by?: string | null
  folder_id?: string | null
}

// 문서 카테고리
export interface DocumentCategory {
  id: string
  name: string
  display_name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// 문서 폴더
export interface DocumentFolder {
  id: string
  name: string
  parent_folder_id?: string | null
  site_id?: string | null
  document_category: string
  owner_id: string
  is_public: boolean
  description?: string | null
  metadata?: any | null
  created_at: string
  updated_at: string
  created_by: string
}

// 문서 접근 권한
export interface DocumentAccessControl {
  id: string
  document_id: string
  user_id?: string | null
  role?: string | null
  site_id?: string | null
  partner_company_id?: string | null
  permission_level: 'view' | 'download' | 'edit' | 'admin'
  conditions?: any | null
  granted_by: string
  granted_at: string
  expires_at?: string | null
  notes?: string | null
  is_active: boolean
}

// 문서 공유 로그
export interface DocumentSharingLog {
  id: string
  document_id: string
  shared_with_user_id?: string | null
  shared_by_user_id: string
  action: string
  permission_level?: string | null
  previous_permission?: string | null
  reason?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

// 확장된 문서 인터페이스 (권한 정보 포함)
export interface DocumentWithPermissions extends Document {
  access_control?: DocumentAccessControl[]
  folder?: DocumentFolder | null
  category?: DocumentCategory | null
  can_edit?: boolean
  can_delete?: boolean
  can_share?: boolean
}

// 고용형태 타입
export type EmploymentType = 'regular_employee' | 'freelancer' | 'daily_worker'

// 세율 설정 인터페이스
export interface TaxRate {
  id: string
  employment_type: EmploymentType
  tax_name: string
  rate: number
  calculation_method: 'percentage' | 'fixed_amount' | 'tiered'
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// 개인별 급여 설정
export interface WorkerSalarySetting {
  id: string
  worker_id: string
  employment_type: EmploymentType
  daily_rate: number
  hourly_rate: number
  custom_tax_rates?: Record<string, number>
  bank_account_info?: {
    bank_name: string
    account_number: string
    account_holder: string
  }
  effective_date: string
  end_date?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

// 급여 계산 결과 (확장)
export interface EnhancedSalaryCalculationResult {
  worker_id: string
  employment_type: EmploymentType
  daily_rate: number
  gross_pay: number
  base_pay: number
  overtime_pay: number
  deductions: {
    income_tax: number
    resident_tax: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    other_deductions: number
  }
  total_tax: number
  net_pay: number
  tax_details: Record<string, any>
}

// 급여 기록 (확장된 인터페이스)
export interface EnhancedSalaryRecord {
  id: string
  worker_id: string
  worker?: {
    full_name: string
    email: string
    role: string
  }
  site_id: string
  site?: {
    name: string
  }
  work_date: string
  employment_type?: EmploymentType
  regular_hours: number
  overtime_hours: number
  labor_hours?: number
  base_pay: number
  overtime_pay: number
  bonus_pay: number
  deductions: number
  income_tax?: number
  resident_tax?: number
  national_pension?: number
  health_insurance?: number
  employment_insurance?: number
  tax_amount?: number
  total_pay: number
  status: 'calculated' | 'approved' | 'paid'
  tax_details?: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

// 고용형태별 급여 요약
export interface EmploymentTypeSalarySummary {
  employment_type: EmploymentType
  worker_count: number
  total_gross_pay: number
  total_tax: number
  total_net_pay: number
  average_daily_rate: number
  total_labor_hours: number
}

// 개인별 급여 계산 파라미터
export interface PersonalSalaryCalculationParams {
  worker_id: string
  work_date: string
  labor_hours: number
  bonus_pay?: number
  additional_deductions?: number
  override_rates?: Record<string, number>
}

// 알림 타입
export type NotificationType = 'info' | 'warning' | 'error' | 'success'

// 알림
export interface Notification {
  id: string
  user_id?: string | null
  title: string
  message: string
  type?: NotificationType | null
  is_read?: boolean | null
  read_at?: string | null
  action_url?: string | null
  created_at: string
}

// 공지사항 우선순위
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

// 공지사항
export interface Announcement {
  id: string
  title: string
  content: string
  priority?: AnnouncementPriority | null
  target_roles?: UserRole[] | null
  target_sites?: string[] | null
  is_active?: boolean | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

// 승인 요청 타입
export type ApprovalRequestType = 'daily_report' | 'document' | 'leave' | 'expense' | 'other'

// 승인 상태
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 승인 요청
export interface ApprovalRequest {
  id: string
  request_type: ApprovalRequestType
  entity_id: string
  requested_by?: string | null
  approved_by?: string | null
  status?: ApprovalStatus | null
  comments?: string | null
  requested_at: string
  processed_at?: string | null
  created_at: string
}

// Export all construction-specific types
export * from './construction'

// 사진대지 PDF 보고서 상태
export type PhotoGridReportStatus = 'active' | 'archived' | 'deleted'

// 사진대지 PDF 생성 방법
export type PhotoGridGenerationMethod = 'canvas' | 'html'

// 사진대지 PDF 보고서
export interface PhotoGridReport {
  id: string
  daily_report_id: string

  // 파일 정보
  title: string
  file_name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null

  // 사진 메타데이터
  total_photo_groups: number
  total_before_photos: number
  total_after_photos: number
  component_types?: string[] | null
  process_types?: string[] | null

  // PDF 생성 정보
  generated_by?: string | null
  generation_method?: PhotoGridGenerationMethod | null
  pdf_options?: any | null // PDF 생성 옵션 JSON

  // 상태 관리
  status: PhotoGridReportStatus
  version: number
  notes?: string | null

  // 다운로드 추적
  download_count: number
  last_downloaded_at?: string | null
  last_downloaded_by?: string | null

  // 타임스탬프
  created_at: string
  updated_at: string

  // 조인된 데이터
  daily_report?: DailyReport | null
  generated_by_profile?: Profile | null
  last_downloaded_by_profile?: Profile | null
}

// 사진대지 PDF 생성 옵션
export interface PhotoGridPDFOptions {
  title: string
  siteName: string
  reportDate: string
  reporterName: string
  photoGroups: PhotoGroup[]
  generationMethod: PhotoGridGenerationMethod
  includeMetadata?: boolean
  compression?: number
}

// 사진대지 PDF 통계
export interface PhotoGridReportStats {
  total_reports: number
  total_file_size: number
  total_downloads: number
  reports_by_method: Record<PhotoGridGenerationMethod, number>
  reports_by_status: Record<PhotoGridReportStatus, number>
  average_file_size: number
  most_downloaded: PhotoGridReport | null
  recent_reports: PhotoGridReport[]
}

// 마킹 도면 문서
export interface MarkupDocument {
  id: string
  title: string
  description?: string
  original_blueprint_url: string
  original_blueprint_filename: string
  markup_data: any[] // MarkupObject[] from markup types
  preview_image_url?: string
  created_by: string
  created_at: string
  updated_at: string
  site_id?: string
  is_deleted: boolean
  file_size: number
  markup_count: number
}

// 마킹 도면 권한
export interface MarkupDocumentPermission {
  id: string
  document_id: string
  user_id: string
  permission_type: 'view' | 'edit' | 'admin'
  granted_by: string
  granted_at: string
  expires_at?: string
}

// 일반 문서 공유 권한
export interface DocumentPermission {
  id: string
  document_id: string
  user_id: string
  permission_type: 'view' | 'edit' | 'admin'
  granted_by: string
  granted_at: string
  expires_at?: string
}

// 현장 문서 (새로운 site_documents 테이블)
export interface SiteDocument {
  id: string
  site_id: string
  document_type: SiteDocumentType
  file_name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null
  uploaded_by?: string | null
  is_active: boolean
  version: number
  notes?: string | null
  created_at: string
  updated_at: string
  // 조인된 정보
  site?: {
    id: string
    name: string
  } | null
  uploader?: {
    id: string
    full_name: string
    email: string
  } | null
}

// 빠른 작업
export interface QuickAction {
  id: string
  title: string
  description?: string
  icon_name: string
  link_url: string
  is_active: boolean
  display_order: number
  created_by?: string
  created_at: string
  updated_at: string
}

// 이메일 알림 상태
export type EmailNotificationStatus = 'pending' | 'sent' | 'failed' | 'scheduled'

// 이메일 알림 타입
export type EmailNotificationType =
  | 'welcome'
  | 'password_reset'
  | 'account_update'
  | 'document_reminder'
  | 'system_notification'

// 이메일 알림 우선순위
export type EmailNotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

// 이메일 알림
export interface EmailNotification {
  id: string
  recipient_email: string
  recipient_name: string
  subject: string
  content: string
  notification_type: EmailNotificationType
  sender_id: string
  priority: EmailNotificationPriority
  status: EmailNotificationStatus
  scheduled_at: string
  sent_at?: string | null
  error_message?: string | null
  metadata?: any | null
  created_by: string
  created_at: string
  updated_at: string
}

// 이메일 템플릿
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: EmailNotificationType
  variables?: string[] | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// Export module-specific types
export * from './attendance'
export * from './daily-reports'
export * from './documents'
export * from './materials'
export * from './site-info'
