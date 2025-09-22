/**
 * daily_reports 테이블 타입 정의
 */

import { UUID, Timestamps, WeatherType, ApprovalStatus, Json } from '../index'

export interface DailyReportsTable extends Timestamps {
  id: UUID
  site_id: UUID
  work_date: string
  weather: WeatherType
  temperature_high?: number | null
  temperature_low?: number | null
  work_start_time?: string | null
  work_end_time?: string | null
  total_workers: number
  total_labor_hours: number
  work_description: string
  safety_notes?: string | null
  special_notes?: string | null
  created_by: UUID
  reviewed_by?: UUID | null
  reviewed_at?: string | null
  status: ApprovalStatus
  metadata?: Json | null
}

export interface DailyReportsInsert {
  id?: UUID
  site_id: UUID
  work_date: string
  weather: WeatherType
  temperature_high?: number | null
  temperature_low?: number | null
  work_start_time?: string | null
  work_end_time?: string | null
  total_workers?: number
  total_labor_hours?: number
  work_description: string
  safety_notes?: string | null
  special_notes?: string | null
  created_by: UUID
  reviewed_by?: UUID | null
  reviewed_at?: string | null
  status?: ApprovalStatus
  metadata?: Json | null
}

export interface DailyReportsUpdate {
  site_id?: UUID
  work_date?: string
  weather?: WeatherType
  temperature_high?: number | null
  temperature_low?: number | null
  work_start_time?: string | null
  work_end_time?: string | null
  total_workers?: number
  total_labor_hours?: number
  work_description?: string
  safety_notes?: string | null
  special_notes?: string | null
  reviewed_by?: UUID | null
  reviewed_at?: string | null
  status?: ApprovalStatus
  metadata?: Json | null
  updated_at?: string
}