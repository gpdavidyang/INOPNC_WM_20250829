/**
 * materials 관련 테이블 타입 정의
 */

import { UUID, Timestamps, Json } from '../index'

// materials 테이블
export interface MaterialsTable extends Timestamps {
  id: UUID
  name: string
  code?: string | null
  category: string
  unit: string
  unit_price?: number | null
  description?: string | null
  supplier?: string | null
  min_stock?: number | null
  current_stock?: number | null
  is_active: boolean
  metadata?: Json | null
}

// material_inventory 테이블
export interface MaterialInventoryTable extends Timestamps {
  id: UUID
  material_id: UUID
  site_id: UUID
  quantity: number
  unit_price?: number | null
  total_value?: number | null
  last_updated: string
  updated_by: UUID
  notes?: string | null
}

// material_transactions 테이블
export interface MaterialTransactionsTable extends Timestamps {
  id: UUID
  material_id: UUID
  site_id: UUID
  transaction_type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  unit_price?: number | null
  total_amount?: number | null
  reference_type?: string | null
  reference_id?: UUID | null
  from_site_id?: UUID | null
  to_site_id?: UUID | null
  transaction_date: string
  performed_by: UUID
  notes?: string | null
  metadata?: Json | null
}

// material_requests 테이블
export interface MaterialRequestsTable extends Timestamps {
  id: UUID
  site_id: UUID
  requested_by: UUID
  request_date: string
  required_date?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled'
  approved_by?: UUID | null
  approved_at?: string | null
  notes?: string | null
  metadata?: Json | null
}

// material_request_items 테이블
export interface MaterialRequestItemsTable extends Timestamps {
  id: UUID
  request_id: UUID
  material_id: UUID
  requested_quantity: number
  approved_quantity?: number | null
  delivered_quantity?: number | null
  unit_price?: number | null
  notes?: string | null
}