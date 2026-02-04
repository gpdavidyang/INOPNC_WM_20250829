import type { Profile } from '@/types'
import type { MaterialUsageFormEntry, WorkContentEntry, WorkerEntry } from '../types'

export const buildMaterialUsagePayload = (entries: MaterialUsageFormEntry[]) => {
  return entries
    .map(entry => {
      const quantityValue = Number(entry.quantity)
      const hasName = entry.materialName?.trim().length > 0

      if (!hasName && !entry.materialId) {
        return null
      }

      return {
        id: entry.id && !entry.id.startsWith('material-') ? entry.id : undefined,
        material_id: entry.materialId || null,
        material_code: entry.materialCode || null,
        material_name: hasName ? entry.materialName.trim() : '',
        quantity: Number.isFinite(quantityValue) ? quantityValue : 0,
        unit: entry.unit || null,
        notes: entry.notes?.trim() || null,
      }
    })
    .filter(
      (
        item
      ): item is {
        id?: string
        material_id: string | null
        material_code: string | null
        material_name: string
        quantity: number
        unit: string | null
        notes: string | null
      } => Boolean(item && item.material_name)
    )
}

export const buildWorkerEntriesPayload = (
  entries: WorkerEntry[],
  workers: Profile[],
  isAllowedLaborHourValue: (val: number) => boolean,
  canManageWorkers: boolean
) => {
  if (!canManageWorkers) return []

  return entries
    .map(entry => {
      const trimmedName = (entry.worker_name || '').trim()
      const hasWorkerReference = entry.worker_id && entry.worker_id.length > 0
      const resolvedName =
        trimmedName ||
        (hasWorkerReference
          ? workers.find(worker => worker.id === entry.worker_id)?.full_name || ''
          : '')
      return {
        ...entry,
        worker_id: hasWorkerReference ? entry.worker_id : null,
        worker_name: resolvedName,
        is_direct_input: entry.is_direct_input || !hasWorkerReference,
      }
    })
    .filter(entry => {
      const hasLabor = isAllowedLaborHourValue(entry.labor_hours) && entry.labor_hours > 0
      const hasWorkerInfo =
        (typeof entry.worker_id === 'string' && entry.worker_id.length > 0) ||
        (entry.worker_name && entry.worker_name.trim().length > 0)
      return hasLabor && hasWorkerInfo
    })
}

export const resolveReportMetadata = (
  primaryEntry: WorkContentEntry | undefined,
  formData: any,
  reportData: any
) => {
  const normalizeLabel = (value?: string | null) => (value || '').trim()

  const resolvedMemberName = primaryEntry
    ? primaryEntry.memberName === '기타'
      ? normalizeLabel(primaryEntry.memberNameOther) ||
        normalizeLabel(formData.member_name) ||
        primaryEntry.memberName
      : normalizeLabel(primaryEntry.memberName) || normalizeLabel(formData.member_name)
    : normalizeLabel(formData.member_name)

  const resolvedProcessType = primaryEntry
    ? primaryEntry.processType === '기타'
      ? normalizeLabel(primaryEntry.processTypeOther) ||
        normalizeLabel(formData.process_type) ||
        primaryEntry.processType
      : normalizeLabel(primaryEntry.processType) || normalizeLabel(formData.process_type)
    : normalizeLabel(formData.process_type)

  const existingMemberName = normalizeLabel(reportData?.member_name)
  const existingProcessType = normalizeLabel(reportData?.process_type)
  const existingWorkSection = normalizeLabel(reportData?.work_section)

  const resolvedWorkSection = normalizeLabel(primaryEntry?.workSection) || existingWorkSection

  return {
    memberName: resolvedMemberName || existingMemberName || '',
    processType: resolvedProcessType || existingProcessType || '',
    workSection: resolvedWorkSection || '',
  }
}
