/**
 * sites 테이블 타입 정의
 */

import { UUID, Timestamps, SiteStatus, Json } from '../index'

export interface SitesTable extends Timestamps {
  id: UUID
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
  status: SiteStatus
  site_manager_id?: UUID | null
  customer_company_id?: UUID | null
  is_active: boolean
  metadata?: Json | null
}

export interface SitesInsert {
  id?: UUID
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
  status?: SiteStatus
  site_manager_id?: UUID | null
  customer_company_id?: UUID | null
  is_active?: boolean
  metadata?: Json | null
}

export interface SitesUpdate {
  name?: string
  code?: string | null
  address?: string
  city?: string | null
  district?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: SiteStatus
  site_manager_id?: UUID | null
  customer_company_id?: UUID | null
  is_active?: boolean
  metadata?: Json | null
  updated_at?: string
}