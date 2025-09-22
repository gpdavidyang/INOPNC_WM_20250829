/**
 * Database 스키마 타입 정의
 * Supabase 테이블 구조를 반영한 타입
 */

// 기본 타임스탬프 필드
export interface Timestamps {
  created_at: string
  updated_at: string
}

// UUID 타입
export type UUID = string

// JSON 타입
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// 데이터베이스 Enum 타입들
export type UserRole = 'admin' | 'site_manager' | 'worker' | 'customer_manager' | 'partner' | 'accountant' | 'executive'
export type DocumentStatus = 'draft' | 'pending' | 'active' | 'archived' | 'deleted' | 'rejected'
export type SiteStatus = 'planning' | 'active' | 'completed' | 'suspended'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'holiday'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'windy'

// Re-export all database table types
export * from './tables/profiles'
export * from './tables/sites'
export * from './tables/daily-reports'
export * from './tables/documents'
export * from './tables/workers'
export * from './tables/materials'
export * from './tables/equipment'
export * from './tables/notifications'
export * from './tables/audit-logs'

// Database helper types
export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface QueryOptions {
  select?: string
  order?: { column: string; ascending: boolean }[]
  limit?: number
  offset?: number
  filter?: Record<string, unknown>
}

export interface MutationOptions {
  returning?: boolean
  onConflict?: string
}