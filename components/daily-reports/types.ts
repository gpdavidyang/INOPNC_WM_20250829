import type { DailyReport, Profile, Site } from '@/types'
import type { UnifiedDailyReport } from '@/types/daily-reports'

export interface DailyReportFormProps {
  mode: 'create' | 'edit'
  sites: Site[]
  currentUser: Profile
  materials?: Material[]
  workers?: Profile[]
  reportData?: DailyReport & {
    site?: unknown
    work_logs?: unknown[]
    weather_conditions?: unknown
    photo_groups?: unknown[]
    worker_entries?: unknown[]
    additional_photos?: unknown[]
  }
  initialUnifiedReport?: UnifiedDailyReport
  hideHeader?: boolean
}

export interface WorkContentEntry {
  id: string
  memberName: string
  memberNameOther?: string
  processType: string
  processTypeOther?: string
  workSection: string
  workSectionOther?: string
  block: string
  dong: string
  floor: string
  beforePhotos: File[]
  afterPhotos: File[]
  beforePhotoPreviews: string[]
  afterPhotoPreviews: string[]
}

export interface WorkerEntry {
  id: string
  worker_id: string
  labor_hours: number
  worker_name?: string
  is_direct_input?: boolean
}

export interface MaterialUsageFormEntry {
  id: string
  materialId?: string | null
  materialCode?: string | null
  materialName: string
  unit?: string | null
  quantity: string
  notes?: string
}

export interface MaterialOptionItem {
  id: string
  name: string
  code: string | null
  unit: string | null
  specification?: string | null
}

export interface Material {
  id: string
  name: string
  code: string | null
  unit?: string | null
  specification?: string | null
  is_active?: boolean
  use_yn?: boolean
}

export const MATERIAL_UNIT_OPTIONS = ['말', '장', '개', 'kg', 'm', 'm²', 'EA'] as const
export const DEFAULT_MATERIAL_UNIT = MATERIAL_UNIT_OPTIONS[0]

export type MaterialInventoryEntry = {
  materialId: string
  quantity: number
  unit?: string | null
  minimum?: number | null
  status?: 'normal' | 'low' | 'out'
  name?: string
}
