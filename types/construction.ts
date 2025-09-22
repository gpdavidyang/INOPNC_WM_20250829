// Enhanced Construction-Specific Type Definitions

// ==========================================
// COMPANY & PARTNER MANAGEMENT
// ==========================================

export type CompanyType = 'general_contractor' | 'subcontractor' | 'supplier' | 'consultant'
export type PartnerStatus = 'active' | 'suspended' | 'terminated'

export interface PartnerCompany {
  id: string
  organization_id: string
  company_name: string
  business_number?: string | null
  company_type?: CompanyType | null
  trade_type?: string[] | null // ['철근', '콘크리트', '전기', '배관', etc.]
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
  status?: PartnerStatus | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

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
}

// ==========================================
// MATERIAL MANAGEMENT
// ==========================================

export interface MaterialCategory {
  id: string
  parent_id?: string | null
  name: string
  code: string
  level: number
  path: string
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  category_id: string
  name: string
  code: string
  specification?: string | null
  unit: string
  unit_price?: number | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export interface MaterialSupplier {
  id: string
  partner_company_id?: string | null
  supplier_name: string
  supplier_code?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  payment_terms?: string | null
  delivery_lead_time?: number | null // days
  is_preferred?: boolean | null
  created_at: string
  updated_at: string
}

export interface MaterialInventory {
  id: string
  site_id: string
  material_id: string
  current_stock: number
  minimum_stock?: number | null
  maximum_stock?: number | null
  last_purchase_date?: string | null
  last_purchase_price?: number | null
  storage_location?: string | null
  created_at: string
  updated_at: string
}

export type MaterialRequestPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MaterialRequestStatus = 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled'

export interface MaterialRequest {
  id: string
  site_id: string
  request_number: string
  request_date: string
  requested_by: string
  required_date: string
  priority?: MaterialRequestPriority | null
  status?: MaterialRequestStatus | null
  approved_by?: string | null
  approved_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface MaterialRequestItem {
  id: string
  material_request_id: string
  material_id: string
  requested_quantity: number
  approved_quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
  supplier_id?: string | null
  notes?: string | null
  created_at: string
}

export type MaterialTransactionType = 'in' | 'out' | 'return' | 'waste' | 'adjustment'

export interface MaterialTransaction {
  id: string
  site_id: string
  material_id: string
  transaction_type: MaterialTransactionType
  quantity: number
  unit_price?: number | null
  reference_type?: string | null
  reference_id?: string | null
  supplier_id?: string | null
  delivery_note_number?: string | null
  transaction_date: string
  notes?: string | null
  created_at: string
  created_by?: string | null
}

// ==========================================
// ENHANCED DAILY REPORTS & WORK LOGS
// ==========================================

export interface WorkLog {
  id: string
  daily_report_id: string
  work_type: string
  location: string
  description: string
  worker_count: number
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface WorkLogMaterial {
  id: string
  work_log_id: string
  material_id: string
  quantity: number
  notes?: string | null
  created_at: string
  updated_at: string
}

// ==========================================
// WORKFORCE MANAGEMENT
// ==========================================

export interface WorkerCertification {
  id: string
  worker_id: string
  certification_type: string // '용접기능사', '전기기능사', etc.
  certification_number?: string | null
  issue_date: string
  expiry_date?: string | null
  issuing_authority?: string | null
  file_attachment_id?: string | null
  created_at: string
  updated_at: string
}

export type SkillLevel = 'apprentice' | 'skilled' | 'expert' | 'master'

export interface WorkerWageRate {
  id: string
  worker_id: string
  effective_date: string
  daily_rate?: number | null
  hourly_rate?: number | null
  overtime_rate?: number | null
  holiday_rate?: number | null
  skill_level?: SkillLevel | null
  created_at: string
  created_by?: string | null
}

export interface AttendanceLocation {
  id: string
  attendance_record_id: string
  check_type: 'in' | 'out'
  latitude?: number | null
  longitude?: number | null
  accuracy?: number | null // meters
  address?: string | null
  device_info?: string | null
  ip_address?: string | null
  created_at: string
}

// ==========================================
// SUBCONTRACTORS
// ==========================================

export interface Subcontractor {
  id: string
  organization_id: string
  name: string
  business_number?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  status?: 'active' | 'inactive' | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface SubcontractorWorker {
  id: string
  daily_report_id: string
  subcontractor_id: string
  worker_count: number
  work_type?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

// ==========================================
// SAFETY MANAGEMENT
// ==========================================

export interface SafetyTrainingRecord {
  id: string
  site_id: string
  training_date: string
  training_type: string // '정기안전교육', '특별안전교육', etc.
  trainer_name: string
  duration_hours: number
  content?: string | null
  created_at: string
  created_by?: string | null
}

export interface SafetyTrainingAttendee {
  id: string
  training_record_id: string
  worker_id: string
  attendance_status?: 'present' | 'absent' | 'late' | null
  test_score?: number | null
  certificate_issued?: boolean | null
  created_at: string
}

export type SafetyInspectionType = '일일점검' | '주간점검' | '월간점검' | '특별점검'
export type SafetyOverallStatus = 'safe' | 'caution' | 'danger'

export interface SafetyInspection {
  id: string
  site_id: string
  inspection_date: string
  inspection_type: SafetyInspectionType
  inspector_name: string
  inspector_company?: string | null
  overall_status?: SafetyOverallStatus | null
  notes?: string | null
  created_at: string
  created_by?: string | null
}

export type SafetyItemStatus = 'pass' | 'fail' | 'na'
export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SafetyInspectionItem {
  id: string
  inspection_id: string
  category: string // '추락방지', '전기안전', '중장비', etc.
  item_description: string
  status?: SafetyItemStatus | null
  severity?: SafetySeverity | null
  corrective_action?: string | null
  due_date?: string | null
  responsible_person?: string | null
  created_at: string
}

export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'critical'

export interface SafetyIncident {
  id: string
  daily_report_id: string
  incident_time: string
  severity: IncidentSeverity
  description: string
  location?: string | null
  involved_workers?: string[] | null
  actions_taken?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

// ==========================================
// EQUIPMENT MANAGEMENT
// ==========================================

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'retired'

export interface Equipment {
  id: string
  site_id: string
  name: string
  model?: string | null
  serial_number?: string | null
  status?: EquipmentStatus | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface EquipmentUsage {
  id: string
  daily_report_id: string
  equipment_id: string
  operator_id?: string | null
  hours_used: number
  fuel_consumed?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

// ==========================================
// QUALITY CONTROL
// ==========================================

export interface QualityStandard {
  id: string
  work_type: string
  standard_name: string
  specification?: string | null
  tolerance_range?: string | null
  test_method?: string | null
  reference_document?: string | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export type QualityInspectionType = '자재검수' | '시공검사' | '완료검사'
export type QualityInspectionResult = 'pass' | 'fail' | 'conditional_pass'

export interface QualityInspection {
  id: string
  daily_report_id: string
  work_log_id?: string | null
  inspection_type: QualityInspectionType
  standard_id?: string | null
  inspector_name: string
  inspection_result?: QualityInspectionResult | null
  measured_values?: Record<string, any> | null
  notes?: string | null
  created_at: string
  created_by?: string | null
}

// ==========================================
// SCHEDULING & PROGRESS
// ==========================================

export interface WorkSchedule {
  id: string
  site_id: string
  schedule_name: string
  work_type: string
  planned_start_date: string
  planned_end_date: string
  actual_start_date?: string | null
  actual_end_date?: string | null
  progress_percentage?: number | null
  parent_schedule_id?: string | null
  sequence_order?: number | null
  dependencies?: string[] | null
  created_at: string
  updated_at: string
}

export interface ScheduleMilestone {
  id: string
  schedule_id: string
  milestone_name: string
  target_date: string
  completed_date?: string | null
  is_critical?: boolean | null
  notes?: string | null
  created_at: string
}

// ==========================================
// FINANCIAL TRACKING
// ==========================================

export type BudgetCategory = '노무비' | '자재비' | '장비비' | '경비'

export interface ProjectBudget {
  id: string
  site_id: string
  budget_category: BudgetCategory
  budget_amount: number
  spent_amount?: number | null
  committed_amount?: number | null
  fiscal_year: number
  fiscal_month?: number | null
  created_at: string
  updated_at: string
}

export interface DailyLaborCost {
  id: string
  daily_report_id: string
  total_regular_hours?: number | null
  total_overtime_hours?: number | null
  total_holiday_hours?: number | null
  regular_cost?: number | null
  overtime_cost?: number | null
  holiday_cost?: number | null
  total_cost?: number | null
  created_at: string
  calculated_at: string
}

// ==========================================
// WEATHER & ENVIRONMENTAL
// ==========================================

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy'
export type DustLevel = 'good' | 'moderate' | 'bad' | 'very_bad'
export type WorkImpact = 'none' | 'minor' | 'major' | 'stop'

export interface WeatherCondition {
  id: string
  site_id: string
  recorded_date: string
  recorded_time: string
  weather_type?: WeatherType | null
  temperature?: number | null
  humidity?: number | null
  wind_speed?: number | null
  precipitation?: number | null
  visibility?: number | null
  dust_level?: DustLevel | null
  work_impact?: WorkImpact | null
  created_at: string
}

// ==========================================
// ENHANCED DOCUMENT MANAGEMENT
// ==========================================

export interface DocumentCategory {
  id: string
  parent_id?: string | null
  category_name: string
  category_code?: string | null
  icon?: string | null
  sort_order?: number | null
  is_system?: boolean | null
  created_at: string
}

export type DocumentAccessType = 'view' | 'download' | 'print' | 'edit'

export interface DocumentAccessLog {
  id: string
  document_id: string
  accessed_by: string
  access_type: DocumentAccessType
  ip_address?: string | null
  user_agent?: string | null
  accessed_at: string
}

// ==========================================
// WORK INSTRUCTIONS & COMMUNICATION
// ==========================================

export type WorkInstructionPriority = 'low' | 'normal' | 'high' | 'urgent'
export type WorkInstructionStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export interface WorkInstruction {
  id: string
  site_id: string
  instruction_date: string
  instruction_number: string
  issued_by: string
  subject: string
  content: string
  priority?: WorkInstructionPriority | null
  due_date?: string | null
  status?: WorkInstructionStatus | null
  created_at: string
  updated_at: string
}

export interface WorkInstructionRecipient {
  id: string
  instruction_id: string
  recipient_id: string
  is_primary?: boolean | null
  read_at?: string | null
  acknowledged_at?: string | null
  created_at: string
}

// ==========================================
// FILE ATTACHMENTS
// ==========================================

export interface FileAttachment {
  id: string
  entity_type: string
  entity_id: string
  file_name: string
  file_path: string
  file_size?: number | null
  mime_type?: string | null
  uploaded_at: string
  uploaded_by?: string | null
}