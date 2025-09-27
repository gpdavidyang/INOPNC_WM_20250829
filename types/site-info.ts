// Site Information Types

export interface SiteAddress {
  id: string
  site_id: string
  full_address: string
  latitude?: number
  longitude?: number
  postal_code?: string
}

export interface AccommodationAddress {
  id: string
  site_id: string
  accommodation_name: string
  full_address: string
  latitude?: number
  longitude?: number
}

export interface ProcessInfo {
  member_name: string // 부재명: 슬라브, 기둥, 거더
  work_process: string // 작업공정: 철근, 거푸집, 콘크리트
  work_section: string // 작업구간: 3층 A구역
  drawing_id?: string // 관련 도면 ID
}

export interface ManagerContact {
  role: 'construction_manager' | 'assistant_manager' | 'safety_manager'
  name: string
  phone: string
  email?: string
  profile_image?: string
}

export interface SiteDocument {
  id: string
  title: string
  file_url: string
  file_name: string
  mime_type: string
  document_type: string
}

export interface SiteInfo {
  id: string
  name: string
  address: SiteAddress
  customer_company?: {
    id: string
    company_name?: string | null
  }
  accommodation?: AccommodationAddress
  process: ProcessInfo
  managers: ManagerContact[]
  construction_period: {
    start_date: string
    end_date: string
  }
  is_active: boolean
  ptw_document?: SiteDocument
  blueprint_document?: SiteDocument
}

export interface SiteSearchFilters {
  siteName?: string // 현장명 검색
  region?: {
    // 지역 검색
    province: string
    city?: string
    district?: string
  }
  workerName?: string // 작업자명 검색
  dateRange?: {
    // 기간 검색
    startDate: Date
    endDate: Date
  }
}

export interface SiteSearchResult {
  id: string
  name: string
  address: string
  construction_period?: {
    start_date?: string | null
    end_date?: string | null
  }
  last_work_date?: string | null
  customer_company_name?: string | null
  progress_percentage?: number
  participant_count?: number
  distance?: number // 현재 위치로부터의 거리
  is_active: boolean
}

export interface SitePreferences {
  user_id: string
  preferred_site_id?: string
  last_accessed_at?: string
  expanded_sections: {
    address: boolean
    accommodation: boolean
    process: boolean
    managers: boolean
  }
}
