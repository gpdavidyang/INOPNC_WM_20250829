// Material Management-specific type definitions

export interface MaterialInventoryItem {
  id: string
  site_id: string
  material_id: string
  material_name: string
  material_code: string
  specification?: string | null
  unit: string
  current_stock: number
  minimum_stock?: number | null
  maximum_stock?: number | null
  last_purchase_date?: string | null
  last_purchase_price?: number | null
  storage_location?: string | null
  category_name?: string
  status?: 'normal' | 'low' | 'out_of_stock'
}

export interface MaterialRequestData {
  id: string
  site_id: string
  request_number: string
  request_date: string
  requested_by: string
  required_date: string
  priority?: 'low' | 'normal' | 'high' | 'urgent' | null
  status?: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled' | null
  approved_by?: string | null
  approved_at?: string | null
  notes?: string | null
  total_amount?: number
  items?: MaterialRequestItemData[]
  requester?: {
    full_name: string
  }
  approver?: {
    full_name: string
  }
}

export interface MaterialRequestItemData {
  id?: string
  material_id: string
  material_name?: string
  material_code?: string
  specification?: string
  unit?: string
  requested_quantity: number
  approved_quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
  supplier_id?: string | null
  supplier_name?: string
  notes?: string | null
}

export interface MaterialTransactionData {
  id: string
  site_id: string
  material_id: string
  material_name?: string
  material_code?: string
  transaction_type: 'in' | 'out' | 'return' | 'waste' | 'adjustment'
  quantity: number
  unit_price?: number | null
  total_price?: number
  reference_type?: string | null
  reference_id?: string | null
  supplier_id?: string | null
  supplier_name?: string
  delivery_note_number?: string | null
  transaction_date: string
  notes?: string | null
  created_at: string
  created_by?: string | null
  creator?: {
    full_name: string
  }
}

export interface MaterialFilter {
  search: string
  category: string
  status: 'all' | 'normal' | 'low' | 'out_of_stock'
  sortBy: 'name' | 'stock' | 'date'
  sortOrder: 'asc' | 'desc'
}

export interface MaterialCategoryHierarchy {
  id: string
  name: string
  code: string
  level: number
  children?: MaterialCategoryHierarchy[]
}

export interface NPC1000Data {
  incoming: number
  used: number
  remaining: number
  date: string
  site_id: string
  notes?: string
}

export interface MaterialSupplierInfo {
  id: string
  supplier_name: string
  supplier_code?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  payment_terms?: string | null
  delivery_lead_time?: number | null
  is_preferred?: boolean | null
}

// 생산 기록 타입
export interface ProductionRecord {
  id: string
  production_date: string
  quantity_produced: number
  unit_cost: number
  total_cost: number
  notes?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// 출고 기록 타입
export interface ShipmentRecord {
  id: string
  shipment_date: string
  site_id: string
  material_request_id?: string | null
  quantity_shipped: number
  planned_delivery_date?: string | null
  actual_delivery_date?: string | null
  status: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled'
  tracking_number?: string | null
  carrier?: string | null
  notes?: string | null
  created_by: string
  created_at: string
  updated_at: string
  site?: {
    name: string
  }
}

// 확장된 재고 정보 타입
export interface MaterialInventoryExtended {
  id: string
  site_id: string
  material_id: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  minimum_threshold: number
  last_updated: string
  site?: {
    name: string
  }
  material?: {
    code: string
    name: string
    unit: string
  }
  status?: 'normal' | 'low' | 'out_of_stock'
}

// 생산 분석 데이터 타입
export interface ProductionAnalytics {
  month: string
  total_produced: number
  avg_unit_cost: number
  total_cost: number
  production_days: number
}

// 출고 분석 데이터 타입
export interface ShipmentAnalytics {
  site_name: string
  month: string
  total_shipped: number
  shipment_count: number
  delivered_count: number
}

// 재고 상태 뷰 타입
export interface InventoryStatus {
  location: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  minimum_threshold: number
  status: 'normal' | 'low' | 'out_of_stock'
  last_updated: string
  site_id: string
  material_id: string
}