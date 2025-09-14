/**
 * 일일 보고서 관련 API 타입 정의
 */


// 일일 보고서
export interface DailyReport {
  id: string
  site_id: string
  site_name?: string
  work_date: string
  weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'windy'
  temperature_high?: number | null
  temperature_low?: number | null
  work_start_time?: string | null
  work_end_time?: string | null
  total_workers: number
  total_labor_hours: number
  work_description: string
  safety_notes?: string | null
  special_notes?: string | null
  materials_used?: MaterialUsage[]
  equipment_used?: EquipmentUsage[]
  incidents?: SafetyIncident[]
  photos?: ReportPhoto[]
  created_by: string
  created_by_name?: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

// 자재 사용 내역
export interface MaterialUsage {
  material_id: string
  material_name: string
  quantity: number
  unit: string
  unit_price?: number | null
  total_price?: number | null
  notes?: string | null
}

// 장비 사용 내역
export interface EquipmentUsage {
  equipment_id: string
  equipment_name: string
  hours_used: number
  operator_id?: string | null
  operator_name?: string | null
  fuel_consumption?: number | null
  notes?: string | null
}

// 안전 사고
export interface SafetyIncident {
  id: string
  incident_type: 'near_miss' | 'minor_injury' | 'major_injury' | 'property_damage'
  description: string
  occurred_at: string
  involved_workers?: string[]
  action_taken?: string | null
  reported_to?: string | null
  severity_level: 1 | 2 | 3 | 4 | 5
}

// 보고서 사진
export interface ReportPhoto {
  id: string
  photo_url: string
  thumbnail_url?: string | null
  caption?: string | null
  location?: string | null
  taken_at?: string | null
  uploaded_by: string
  tags?: string[]
}

// 작업 내역
export interface WorkActivity {
  id: string
  daily_report_id: string
  activity_type: string
  description: string
  location?: string | null
  start_time?: string | null
  end_time?: string | null
  workers_involved: number
  completion_percentage?: number | null
  notes?: string | null
}

// 일일 보고서 목록 요청
export interface DailyReportListRequest {
  site_id?: string
  date_from?: string
  date_to?: string
  status?: DailyReport['status']
  created_by?: string
  reviewed_by?: string
  weather?: DailyReport['weather']
  search?: string
  page?: number
  limit?: number
  sort_by?: 'work_date' | 'created_at' | 'updated_at' | 'total_workers'
  sort_order?: 'asc' | 'desc'
}

// 일일 보고서 생성/수정 요청
export interface DailyReportMutationRequest {
  site_id: string
  work_date: string
  weather: DailyReport['weather']
  temperature_high?: number
  temperature_low?: number
  work_start_time?: string
  work_end_time?: string
  work_description: string
  safety_notes?: string
  special_notes?: string
  materials_used?: MaterialUsage[]
  equipment_used?: EquipmentUsage[]
  worker_assignments?: WorkerAssignment[]
}

// 작업자 배정 (일일 보고서용)
export interface WorkerAssignment {
  worker_id: string
  labor_hours: number
  work_type?: string
  overtime_hours?: number
  notes?: string
}

// 일일 보고서 요약
export interface DailyReportSummary {
  date: string
  total_sites: number
  total_workers: number
  total_labor_hours: number
  total_incidents: number
  total_reports: number
  submitted_reports: number
  approved_reports: number
  pending_reports: number
}

// 월별 보고서 통계
export interface MonthlyReportStatistics {
  year: number
  month: number
  total_work_days: number
  total_workers_deployed: number
  total_labor_hours: number
  average_daily_workers: number
  average_daily_hours: number
  total_materials_cost?: number | null
  total_equipment_hours?: number | null
  safety_incidents: number
  completion_rate: number
}

// 보고서 승인 요청
export interface ApproveReportRequest {
  report_id: string
  approval_notes?: string
  signature?: string
}

// 보고서 반려 요청
export interface RejectReportRequest {
  report_id: string
  rejection_reason: string
  required_corrections?: string[]
}