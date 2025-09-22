/**
 * profiles 테이블 타입 정의
 */

import { UUID, Timestamps, UserRole, Json } from '../index'

export interface ProfilesTable extends Timestamps {
  id: UUID
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  profile_image?: string | null
  organization_id?: UUID | null
  site_id?: UUID | null
  is_active: boolean
  last_login?: string | null
  notification_settings?: Json | null
  metadata?: Json | null
  daily_wage?: number | null
  hourly_rate?: number | null
}

export interface ProfilesInsert {
  id?: UUID
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  profile_image?: string | null
  organization_id?: UUID | null
  site_id?: UUID | null
  is_active?: boolean
  notification_settings?: Json | null
  metadata?: Json | null
  daily_wage?: number | null
  hourly_rate?: number | null
}

export interface ProfilesUpdate {
  email?: string
  full_name?: string
  phone?: string | null
  role?: UserRole
  profile_image?: string | null
  organization_id?: UUID | null
  site_id?: UUID | null
  is_active?: boolean
  last_login?: string | null
  notification_settings?: Json | null
  metadata?: Json | null
  daily_wage?: number | null
  hourly_rate?: number | null
  updated_at?: string
}