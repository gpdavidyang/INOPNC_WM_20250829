/**
 * 현장 관련 API 타입 정의
 */

// 현장 정보
export interface Site {
  id: string
  name: string
  code?: string | null
  address: string
  city?: string | null
  district?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  status: 'planning' | 'active' | 'completed' | 'suspended'
  site_manager_id?: string | null
  site_manager_name?: string | null
  customer_company_id?: string | null
  customer_company_name?: string | null
  partner_company_ids?: string[]
  total_workers?: number
  is_active: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 현장 통계
export interface SiteStatistics {
  site_id: string
  total_workers: number
  active_workers: number
  total_work_days: number
  total_work_hours: number
  average_daily_workers: number
  average_daily_hours: number
  current_month_hours: number
  last_month_hours: number
  total_documents: number
  total_reports: number
  completion_rate: number
}

// 현장 작업 일정
export interface SiteSchedule {
  id: string
  site_id: string
  schedule_date: string
  work_type: string
  description?: string | null
  required_workers: number
  assigned_workers: number
  start_time?: string | null
  end_time?: string | null
  is_holiday: boolean
  weather?: string | null
  notes?: string | null
  created_by: string
  created_at: string
}

// 현장 자재
export interface SiteMaterial {
  id: string
  site_id: string
  material_id: string
  material_name: string
  quantity: number
  unit: string
  unit_price?: number | null
  total_price?: number | null
  supplier?: string | null
  delivered_date?: string | null
  used_quantity: number
  remaining_quantity: number
  status: 'ordered' | 'delivered' | 'in_use' | 'depleted'
  notes?: string | null
}

// 현장 장비
export interface SiteEquipment {
  id: string
  site_id: string
  equipment_id: string
  equipment_name: string
  equipment_type: string
  serial_number?: string | null
  rental_start?: string | null
  rental_end?: string | null
  daily_rate?: number | null
  status: 'available' | 'in_use' | 'maintenance' | 'returned'
  operator_id?: string | null
  operator_name?: string | null
  notes?: string | null
}

// 현장 목록 요청
export interface SiteListRequest {
  status?: Site['status']
  customer_company_id?: string
  site_manager_id?: string
  is_active?: boolean
  search?: string
  city?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
  sort_by?: 'name' | 'created_at' | 'start_date' | 'status'
  sort_order?: 'asc' | 'desc'
}

// 현장 생성/수정 요청
export interface SiteMutationRequest {
  name: string
  code?: string
  address: string
  city?: string
  district?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  description?: string
  start_date?: string
  end_date?: string
  status?: Site['status']
  site_manager_id?: string
  customer_company_id?: string
  partner_company_ids?: string[]
  metadata?: Record<string, unknown>
}

// 현장 전환 요청
export interface SwitchSiteRequest {
  user_id: string
  site_id: string
  effective_date?: string
}

// 현장 작업자 목록
export interface SiteWorkerList {
  site_id: string
  workers: Array<{
    id: string
    user_id: string
    full_name: string
    role: string
    daily_wage?: number
    joined_date: string
    total_work_days: number
    is_active: boolean
  }>
  total_count: number
}

// 현장 일일 요약
export interface SiteDailySummary {
  site_id: string
  date: string
  total_workers: number
  total_hours: number
  work_types: string[]
  weather?: string | null
  temperature?: number | null
  notes?: string | null
  incidents?: number
  materials_used?: Record<string, number>
  equipment_used?: string[]
}