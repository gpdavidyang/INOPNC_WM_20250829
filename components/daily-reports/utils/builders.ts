import type { Profile } from '@/types'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import type {
  DailyReportFormProps,
  DEFAULT_MATERIAL_UNIT,
  MaterialUsageFormEntry,
  WorkContentEntry,
  WorkerEntry,
} from '../types'
import { DEFAULT_MATERIAL_UNIT as TYPE_DEFAULT_MATERIAL_UNIT } from '../types'

const DEFAULT_MATERIAL_UNIT = TYPE_DEFAULT_MATERIAL_UNIT

export const sanitizeUnitLabel = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  if (!normalized) return null
  return normalized
}
export const createReportKey = (reportData?: DailyReportFormProps['reportData'] | null) => {
  if (!reportData?.id) return null
  return `edit-${reportData.id}-${reportData.updated_at || Date.now()}`
}

export const normalizeMaterialKeyword = (value?: string | null) =>
  value
    ? value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
    : ''

export const isSelectableMaterial = (material: any): boolean => {
  if (!material) return false

  // 'Item Management'에서 비활성화(is_active = false)된 경우만 제외
  if (material.is_active === false) return false

  // 그 외 use_yn 등의 플래그가 false인 경우 명시적으로 체크
  const useFlag = interpretMaterialActiveFlag(
    material?.use_yn ??
      material?.useYn ??
      material?.use_flag ??
      material?.useFlag ??
      material?.is_use ??
      material?.isUse
  )
  if (useFlag === false) return false

  return true
}

export const interpretMaterialActiveFlag = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'y', 'yes', 'active', 'enabled'].includes(normalized)) return true
  if (['false', '0', 'n', 'no', 'inactive', 'disabled'].includes(normalized)) return false
  return null
}

export const buildFormDataFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData'],
  currentUser: Profile
) => {
  if (mode === 'edit' && reportData) {
    return {
      site_id:
        reportData.site_id ||
        (currentUser as unknown as { site_id?: string | null })?.site_id ||
        '',
      partner_company_id: reportData.partner_company_id || '',
      work_date: reportData.work_date || new Date().toISOString().split('T')[0],
      member_name: reportData.member_name || '',
      process_type: reportData.process_type || '',
      total_workers: reportData.total_workers || 0,
      total_labor_hours:
        (reportData as any).total_labor_hours !== undefined
          ? Number((reportData as any).total_labor_hours) || 0
          : 0,
      npc1000_incoming: reportData.npc1000_incoming || 0,
      npc1000_used: reportData.npc1000_used || 0,
      npc1000_remaining: reportData.npc1000_remaining || 0,
      issues: reportData.issues || '',
      component_name: reportData.component_name || '',
      work_process: reportData.work_process || '',
      work_section: reportData.work_section || '',
      hq_request: reportData.hq_request || '',
      created_by: reportData.created_by || currentUser.full_name,
    }
  }
  return {
    site_id: (currentUser as unknown as { site_id?: string | null })?.site_id || '',
    partner_company_id: '',
    work_date: new Date().toISOString().split('T')[0],
    member_name: '',
    process_type: '',
    total_workers: 0,
    total_labor_hours: 0,
    npc1000_incoming: 0,
    npc1000_used: 0,
    npc1000_remaining: 0,
    issues: '',
    component_name: '',
    work_process: '',
    work_section: '',
    hq_request: '',
    created_by: currentUser.full_name,
  }
}

export const buildWorkEntriesFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData']
): WorkContentEntry[] => {
  if (mode === 'edit' && reportData?.work_logs?.length) {
    return reportData.work_logs.map((log: any, index: number) => ({
      id: log?.id || `work-${index}-${Math.random().toString(36).slice(2, 8)}`,
      memberName: log?.component_type || '',
      memberNameOther: log?.component_type_other || '',
      processType: log?.process_type || '',
      processTypeOther: log?.process_type_other || '',
      workSection: log?.work_section || '',
      workSectionOther: log?.work_section_other || '',
      block: log?.block || log?.location?.block || '',
      dong: log?.dong || log?.location?.dong || '',
      floor: log?.floor || log?.unit || log?.location?.unit || '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: [],
    }))
  }
  return [
    {
      id: `work-${Math.random().toString(36).slice(2, 8)}`,
      memberName: '',
      memberNameOther: '',
      processType: '',
      processTypeOther: '',
      workSection: '',
      workSectionOther: '',
      block: '',
      dong: '',
      floor: '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: [],
    },
  ]
}

export const buildWorkerEntriesFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData'],
  canManageWorkers: boolean,
  coerceLaborHour: (value: unknown) => number,
  defaultLaborHour: number
): WorkerEntry[] => {
  if (mode === 'edit' && reportData?.worker_entries?.length) {
    return reportData.worker_entries.map((entry: any, index: number) => ({
      id: entry?.id || `worker-${index}-${Math.random().toString(36).slice(2, 8)}`,
      worker_id: entry?.worker_id || entry?.workerId || '',
      labor_hours: coerceLaborHour(entry?.labor_hours ?? entry?.hours),
      worker_name: entry?.worker_name || entry?.workerName || '',
      is_direct_input:
        entry?.worker_id || entry?.workerId
          ? false
          : entry?.is_direct_input || entry?.isDirectInput || false,
    }))
  }
  if (!canManageWorkers) return []
  return [
    {
      id: `worker-${Math.random().toString(36).slice(2, 8)}`,
      worker_id: '',
      labor_hours: defaultLaborHour,
      worker_name: '',
      is_direct_input: false,
    },
  ]
}

export const buildMaterialUsageEntriesFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData']
): MaterialUsageFormEntry[] => {
  const fromReportData =
    mode === 'edit' && Array.isArray((reportData as any)?.materials)
      ? ((reportData as any)?.materials as any[])
      : Array.isArray((reportData as any)?.material_usage)
        ? ((reportData as any)?.material_usage as any[])
        : []

  if (fromReportData.length === 0) return []

  return fromReportData.map((entry, index) => {
    let materialId =
      entry.materialId || entry.material_id || entry.material_code || entry.materialCode || null
    const materialName =
      entry.materialName ||
      entry.material_name ||
      entry.materialCode ||
      entry.material_code ||
      `자재-${index + 1}`
    const materialCode = entry.materialCode || entry.material_code || null
    const rawQty = entry.quantity ?? (entry as any).qty ?? (entry as any).amount ?? ''
    const quantity = rawQty !== undefined && rawQty !== null ? String(rawQty) : ''
    const unit =
      sanitizeUnitLabel(
        entry.unit ||
          (entry as any).unit_name ||
          (entry as any).unit_label ||
          (entry as any).unitName ||
          null
      ) ?? DEFAULT_MATERIAL_UNIT

    const notes = entry.notes || (entry as any).memo || (entry as any).description || ''

    return {
      id: entry.id || `material-${index}-${Math.random().toString(36).slice(2, 5)}`,
      materialId,
      materialCode,
      materialName,
      unit,
      quantity,
      notes,
    }
  })
}

export const buildAdditionalPhotosFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData']
): AdditionalPhotoData[] => {
  if (mode === 'edit' && reportData?.additional_photos?.length) {
    return (reportData.additional_photos as AdditionalPhotoData[]).map((photo, index) => {
      const legacyPhoto = photo as AdditionalPhotoData & {
        preview?: string | null
        file_name?: string
      }
      return {
        id: legacyPhoto.id ?? `existing-${index}`,
        photo_type: legacyPhoto.photo_type === 'after' ? 'after' : 'before',
        description: legacyPhoto.description || '',
        file: null,
        url: legacyPhoto.url || legacyPhoto.preview || null,
        path: legacyPhoto.path,
        filename: legacyPhoto.filename || legacyPhoto.file_name || `photo-${index + 1}.jpg`,
        upload_order: legacyPhoto.upload_order ?? index + 1,
        file_size: legacyPhoto.file_size,
      }
    })
  }
  return []
}

export const mapMaterialToOption = (material: any): MaterialOptionItem => ({
  id: String(material.id),
  name:
    material.name || material.material_name || material.title || material.code || '이름 없는 자재',
  code: material.code || material.material_code || null,
  unit: sanitizeUnitLabel(material.unit || material.unit_name || material.unit_symbol || null),
  specification: material.specification || material.material_specification || null,
})
