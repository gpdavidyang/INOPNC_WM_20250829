// Equipment Management-specific type definitions

export interface EquipmentCategory {
  id: string
  name: string
  description?: string | null
  parent_id?: string | null
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  code: string
  name: string
  category_id?: string | null
  manufacturer?: string | null
  model?: string | null
  serial_number?: string | null
  purchase_date?: string | null
  purchase_price?: number | null
  current_value?: number | null
  status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'retired'
  site_id?: string | null
  location?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  category?: EquipmentCategory
  site?: {
    id: string
    name: string
  }
}

export interface EquipmentCheckout {
  id: string
  equipment_id: string
  checked_out_by: string
  checked_out_at: string
  expected_return_date?: string | null
  actual_return_date?: string | null
  checked_in_by?: string | null
  checked_in_at?: string | null
  site_id: string
  purpose?: string | null
  condition_out: 'excellent' | 'good' | 'fair' | 'poor'
  condition_in?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null
  damage_notes?: string | null
  created_at: string
  updated_at: string
  // Relations
  equipment?: Equipment
  checked_out_user?: {
    id: string
    full_name: string
  }
  checked_in_user?: {
    id: string
    full_name: string
  }
  site?: {
    id: string
    name: string
  }
}

export interface EquipmentMaintenance {
  id: string
  equipment_id: string
  maintenance_type: 'routine' | 'repair' | 'inspection' | 'calibration'
  scheduled_date: string
  completed_date?: string | null
  performed_by?: string | null
  cost?: number | null
  description?: string | null
  next_maintenance_date?: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  // Relations
  equipment?: Equipment
  performed_by_user?: {
    id: string
    full_name: string
  }
}

export interface WorkerSkill {
  id: string
  name: string
  description?: string | null
  category?: string | null
  created_at: string
  updated_at: string
}

export interface WorkerSkillAssignment {
  id: string
  worker_id: string
  skill_id: string
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  certified: boolean
  certification_date?: string | null
  certification_expiry?: string | null
  hourly_rate?: number | null
  overtime_rate?: number | null
  created_at: string
  updated_at: string
  // Relations
  worker?: {
    id: string
    full_name: string
  }
  skill?: WorkerSkill
}

export interface ResourceAllocation {
  id: string
  allocation_type: 'worker' | 'equipment'
  resource_id: string // Either worker_id or equipment_id
  site_id: string
  daily_report_id?: string | null
  allocated_date: string
  start_time?: string | null
  end_time?: string | null
  hours_worked?: number | null
  regular_hours?: number | null
  overtime_hours?: number | null
  hourly_rate?: number | null
  overtime_rate?: number | null
  total_cost?: number | null
  task_description?: string | null
  notes?: string | null
  created_by: string
  approved_by?: string | null
  approved_at?: string | null
  created_at: string
  updated_at: string
  // Relations
  site?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    full_name: string
  }
  approved_by_user?: {
    id: string
    full_name: string
  }
  // Dynamic relations based on allocation_type
  worker?: {
    id: string
    full_name: string
  }
  equipment?: Equipment
}

export interface EquipmentLocationHistory {
  id: string
  equipment_id: string
  site_id: string
  location?: string | null
  moved_by: string
  moved_at: string
  reason?: string | null
  created_at: string
  // Relations
  equipment?: Equipment
  site?: {
    id: string
    name: string
  }
  moved_by_user?: {
    id: string
    full_name: string
  }
}

// Filter and stats interfaces
export interface EquipmentFilter {
  search: string
  category: string
  status: 'all' | 'available' | 'in_use' | 'maintenance' | 'damaged' | 'retired'
  site: string
  sortBy: 'name' | 'code' | 'status' | 'category'
  sortOrder: 'asc' | 'desc'
}

export interface EquipmentStats {
  totalEquipment: number
  availableEquipment: number
  inUseEquipment: number
  maintenanceEquipment: number
  damagedEquipment: number
  activeCheckouts: number
  overdueReturns: number
  upcomingMaintenance: number
}

export interface ResourceAllocationStats {
  totalWorkers: number
  totalEquipment: number
  totalHours: number
  totalCost: number
  regularHours: number
  overtimeHours: number
  utilizationRate: number
}