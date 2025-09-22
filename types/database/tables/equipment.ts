/**
 * equipment 관련 테이블 타입 정의
 */


// equipment 테이블
export interface EquipmentTable extends Timestamps {
  id: UUID
  name: string
  code?: string | null
  equipment_type: string
  model?: string | null
  manufacturer?: string | null
  serial_number?: string | null
  purchase_date?: string | null
  purchase_price?: number | null
  current_value?: number | null
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  is_active: boolean
  metadata?: Json | null
}

// equipment_assignments 테이블
export interface EquipmentAssignmentsTable extends Timestamps {
  id: UUID
  equipment_id: UUID
  site_id: UUID
  assigned_date: string
  return_date?: string | null
  operator_id?: UUID | null
  daily_rate?: number | null
  notes?: string | null
  is_active: boolean
}

// equipment_usage 테이블
export interface EquipmentUsageTable extends Timestamps {
  id: UUID
  equipment_id: UUID
  site_id: UUID
  daily_report_id?: UUID | null
  usage_date: string
  hours_used: number
  operator_id?: UUID | null
  fuel_consumption?: number | null
  maintenance_notes?: string | null
  reported_by: UUID
  metadata?: Json | null
}

// equipment_maintenance 테이블
export interface EquipmentMaintenanceTable extends Timestamps {
  id: UUID
  equipment_id: UUID
  maintenance_type: 'routine' | 'repair' | 'inspection' | 'overhaul'
  maintenance_date: string
  next_maintenance_date?: string | null
  description: string
  cost?: number | null
  performed_by?: string | null
  parts_replaced?: Json | null
  notes?: string | null
  metadata?: Json | null
}