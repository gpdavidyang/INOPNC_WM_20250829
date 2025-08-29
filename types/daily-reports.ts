// Daily Report-specific type definitions

import { DailyReportStatus } from './index'

export interface DailyReportFormData {
  id?: string
  site_id: string | null
  work_date: string
  member_name: string
  process_type: string
  work_section?: string
  total_workers: number
  npc1000_incoming: number
  npc1000_used: number
  npc1000_remaining: number
  issues: string
  status: DailyReportStatus
  weather_conditions?: WeatherData
  work_logs?: WorkLogData[]
  equipment_usage?: EquipmentUsageData[]
  safety_incidents?: SafetyIncidentData[]
  quality_inspections?: QualityInspectionData[]
  material_usage?: MaterialUsageData[]
  subcontractor_workers?: SubcontractorWorkerData[]
  partner_companies?: PartnerCompanyWorkerData[]
  workers?: WorkerData[]
  before_photos?: PhotoData[]
  after_photos?: PhotoData[]
  additional_before_photos?: AdditionalPhotoData[]
  additional_after_photos?: AdditionalPhotoData[]
  receipts?: ReceiptData[]
}

export interface WeatherData {
  weather_type: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  temperature?: number | null
  humidity?: number | null
  wind_speed?: number | null
  precipitation?: number | null
  dust_level?: 'good' | 'moderate' | 'bad' | 'very_bad' | null
  work_impact?: 'none' | 'minor' | 'major' | 'stop' | null
}

export interface WorkLogData {
  id?: string
  work_type: string
  location: string
  description: string
  worker_count: number
  notes?: string | null
}

export interface EquipmentUsageData {
  id?: string
  equipment_id: string
  equipment_name?: string
  hours_used: number
  operator_id?: string | null
  operator_name?: string
  fuel_consumed?: number | null
  notes?: string | null
}

export interface SafetyIncidentData {
  id?: string
  incident_time: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  description: string
  location?: string | null
  involved_workers?: string[] | null
  actions_taken?: string | null
}

export interface QualityInspectionData {
  id?: string
  inspection_type: 'material' | 'construction' | 'completion'
  standard_name?: string
  inspector_name: string
  result: 'pass' | 'fail' | 'conditional_pass'
  notes?: string | null
}

export interface MaterialUsageData {
  id?: string
  material_id: string
  material_name?: string
  quantity: number
  unit?: string
  notes?: string | null
}

export interface SubcontractorWorkerData {
  id?: string
  subcontractor_id: string
  subcontractor_name?: string
  worker_count: number
  work_type?: string | null
  notes?: string | null
}

export interface PartnerCompanyWorkerData {
  id?: string
  partner_company_id: string
  partner_company_name?: string
  worker_count: number
  trade_type?: string | null
  work_scope?: string | null
  notes?: string | null
}

export interface DailyReportExpandedSections {
  weather: boolean
  workLogs: boolean
  equipment: boolean
  safety: boolean
  quality: boolean
  materials: boolean
  subcontractors: boolean
  partnerCompanies: boolean
}

export interface MaterialInventoryData {
  incoming: number
  used: number
  remaining: number
  date: string
}

export interface FileUploadData {
  file: File
  type: 'before' | 'progress' | 'after' | 'document'
  description?: string
}

export interface WorkerData {
  id?: string
  name: string
  position?: string
  hours: number
  notes?: string
}

export interface PhotoData {
  id?: string
  url?: string
  path?: string
  filename: string
  description?: string
  type: 'before' | 'after' | 'progress'
  file_size?: number
  uploaded_at?: string
}

export interface AdditionalPhotoData {
  id?: string
  file?: File
  url?: string
  path?: string
  filename: string
  description?: string
  photo_type: 'before' | 'after'
  file_size?: number
  upload_order: number
  uploaded_by?: string
  uploaded_at?: string
}

export interface ReceiptData {
  id?: string
  filename: string
  url?: string
  path?: string
  amount?: number
  vendor?: string
  description?: string
  date?: string
  file_size?: number
  uploaded_at?: string
}