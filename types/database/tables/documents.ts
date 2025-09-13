/**
 * documents 관련 테이블 타입 정의
 */

import { UUID, Timestamps, DocumentStatus, Json, ApprovalStatus } from '../index'

// markup_documents 테이블
export interface MarkupDocumentsTable extends Timestamps {
  id: UUID
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  owner_id: UUID
  site_id?: UUID | null
  daily_report_id?: UUID | null
  status: DocumentStatus
  is_public: boolean
  is_archived: boolean
  metadata?: Json | null
}

// shared_documents 테이블
export interface SharedDocumentsTable extends Timestamps {
  id: UUID
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  category?: string | null
  uploaded_by: UUID
  site_id?: UUID | null
  is_public: boolean
  tags?: string[] | null
  metadata?: Json | null
}

// document_requirements 테이블
export interface DocumentRequirementsTable extends Timestamps {
  id: UUID
  requirement_name: string
  description?: string | null
  document_type?: string | null
  is_mandatory: boolean
  valid_duration_days?: number | null
  file_format_allowed?: string[] | null
  max_file_size_mb?: number | null
  is_active: boolean
  metadata?: Json | null
}

// user_document_submissions 테이블
export interface UserDocumentSubmissionsTable extends Timestamps {
  id: UUID
  user_id: UUID
  requirement_id: UUID
  file_url: string
  file_name: string
  submission_status: ApprovalStatus
  submitted_at: string
  reviewed_at?: string | null
  reviewed_by?: UUID | null
  review_comment?: string | null
  expiry_date?: string | null
  metadata?: Json | null
}

// photo_grid_reports 테이블
export interface PhotoGridReportsTable extends Timestamps {
  id: UUID
  title: string
  description?: string | null
  photos: Json // Array of photo objects
  site_id: UUID
  daily_report_id?: UUID | null
  created_by: UUID
  is_public: boolean
  metadata?: Json | null
}

// receipts 테이블
export interface ReceiptsTable extends Timestamps {
  id: UUID
  receipt_number: string
  amount: number
  vendor_name: string
  purchase_date: string
  category?: string | null
  description?: string | null
  file_url?: string | null
  site_id?: UUID | null
  uploaded_by: UUID
  approved_by?: UUID | null
  approved_at?: string | null
  status: ApprovalStatus
  metadata?: Json | null
}