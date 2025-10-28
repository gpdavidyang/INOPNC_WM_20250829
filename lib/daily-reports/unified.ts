import type {
  AdditionalPhotoData,
  AdminDailyReportFormState,
  UnifiedAttachment,
  UnifiedAttachments,
  UnifiedDailyReport,
  UnifiedDailyReportStatus,
  UnifiedMaterialEntry,
  UnifiedNpcUsage,
  UnifiedTaskGroup,
  UnifiedWorkEntry,
  UnifiedWorkerEntry,
} from '@/types/daily-reports'

const today = () => new Date().toISOString().split('T')[0]

const emptyAttachments = (): UnifiedAttachments => ({
  photos: [],
  drawings: [],
  confirmations: [],
  others: [],
})

const normalizeString = (value: unknown, fallback = '') =>
  value === undefined || value === null ? fallback : String(value)

const normalizeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const mapWorkerToLegacy = (worker: UnifiedWorkerEntry) => ({
  id: worker.id,
  worker_id: worker.workerId || null,
  worker_name: worker.workerName || '',
  labor_hours: Number.isFinite(worker.hours) ? worker.hours : 0,
  is_direct_input: worker.isDirectInput ?? !worker.workerId,
  notes: worker.notes || '',
})

export const createEmptyUnifiedDailyReport = (
  initial?: Partial<UnifiedDailyReport>
): UnifiedDailyReport => ({
  id: initial?.id,
  siteId: initial?.siteId || '',
  siteName: initial?.siteName,
  partnerCompanyId: initial?.partnerCompanyId,
  partnerCompanyName: initial?.partnerCompanyName,
  workDate: initial?.workDate || today(),
  status: (initial?.status as UnifiedDailyReportStatus) || 'draft',
  authorId: initial?.authorId,
  authorName: initial?.authorName,
  location: initial?.location || {},
  memberTypes: [...(initial?.memberTypes || [])],
  workProcesses: [...(initial?.workProcesses || [])],
  workTypes: [...(initial?.workTypes || [])],
  workEntries: [...(initial?.workEntries || [])],
  taskGroups: initial?.taskGroups ? [...initial.taskGroups] : undefined,
  workers: [...(initial?.workers || [])],
  materials: [...(initial?.materials || [])],
  npcUsage: initial?.npcUsage ? { ...initial.npcUsage } : undefined,
  attachments: initial?.attachments
    ? {
        photos: [...(initial.attachments.photos || [])],
        drawings: [...(initial.attachments.drawings || [])],
        confirmations: [...(initial.attachments.confirmations || [])],
        others: [...(initial.attachments.others || [])],
      }
    : emptyAttachments(),
  additionalPhotos: [...(initial?.additionalPhotos || [])],
  hqRequest: initial?.hqRequest,
  issues: initial?.issues,
  safetyNotes: initial?.safetyNotes,
  notes: initial?.notes,
  progress: initial?.progress,
  meta: initial?.meta ? { ...initial.meta } : {},
  createdAt: initial?.createdAt,
  updatedAt: initial?.updatedAt,
})

export const unifiedReportToLegacyPayload = (
  unified: UnifiedDailyReport,
  options?: { includeWorkers?: boolean }
) => {
  const primaryEntry: UnifiedWorkEntry | undefined = unified.workEntries?.[0]
  const npcUsage: UnifiedNpcUsage | undefined = unified.npcUsage
  const includeWorkers = options?.includeWorkers ?? true

  return {
    site_id: unified.siteId,
    partner_company_id: unified.partnerCompanyId ?? '',
    work_date: unified.workDate,
    member_name: primaryEntry?.memberName || unified.memberTypes?.[0] || '',
    process_type: primaryEntry?.processType || unified.workProcesses?.[0] || '',
    work_section: primaryEntry?.workSection || '',
    component_name: (unified.meta?.componentName as string | undefined) || '',
    work_process: (unified.meta?.workProcess as string | undefined) || '',
    total_workers:
      (unified.meta?.totalWorkers as number | undefined) ??
      (includeWorkers ? unified.workers.length : undefined) ??
      0,
    status: unified.status,
    created_by: unified.authorId,
    npc1000_incoming: npcUsage?.incoming ?? 0,
    npc1000_used: npcUsage?.used ?? 0,
    npc1000_remaining: npcUsage?.remaining ?? 0,
    hq_request: unified.hqRequest ?? '',
    issues: unified.issues ?? '',
    notes: unified.notes ?? '',
    location_info: {
      block: unified.location?.block || '',
      dong: unified.location?.dong || '',
      unit: unified.location?.unit || '',
    },
    additional_notes: {
      safetyNotes: unified.safetyNotes || '',
      memberTypes: unified.memberTypes || [],
      workProcesses: unified.workProcesses || [],
      workTypes: unified.workTypes || [],
      workContents: unified.meta?.workContents || [],
    },
    work_entries: unified.workEntries || [],
    worker_entries: includeWorkers ? unified.workers.map(mapWorkerToLegacy) : [],
    additional_photos: unified.additionalPhotos || [],
    attachments: unified.attachments || emptyAttachments(),
  }
}

export const adminFormStateToUnified = (
  state: AdminDailyReportFormState,
  status: UnifiedDailyReportStatus = 'draft'
): UnifiedDailyReport => {
  const workEntries = state.workEntries || []
  const workers = state.workerEntries || []
  const materials: UnifiedMaterialEntry[] = []
  const attachments: UnifiedAttachments = emptyAttachments()
  const additionalPhotos: AdditionalPhotoData[] = state.additionalPhotos || []

  return createEmptyUnifiedDailyReport({
    id: state.formData.id,
    siteId: state.formData.site_id,
    partnerCompanyId: state.formData.partner_company_id,
    workDate: state.formData.work_date,
    status,
    authorId: state.formData.created_by,
    location: {
      block: undefined,
      dong: undefined,
      unit: undefined,
    },
    memberTypes: workEntries.map(entry => entry.memberName).filter(Boolean),
    workProcesses: workEntries.map(entry => entry.processType).filter(Boolean),
    workEntries,
    workers,
    materials,
    attachments,
    additionalPhotos,
    hqRequest: state.formData.hq_request || '',
    issues: state.formData.issues || '',
    notes: state.formData.notes || '',
  })
}

export const unifiedToAdminFormState = (unified: UnifiedDailyReport): AdminDailyReportFormState => {
  const primaryEntry = unified.workEntries?.[0]

  return {
    formData: {
      id: unified.id,
      site_id: unified.siteId,
      partner_company_id: unified.partnerCompanyId,
      work_date: unified.workDate,
      member_name: primaryEntry?.memberName || unified.memberTypes?.[0] || '',
      process_type: primaryEntry?.processType || unified.workProcesses?.[0] || '',
      work_section: primaryEntry?.workSection || '',
      component_name: (unified.meta?.componentName as string | undefined) || '',
      work_process: (unified.meta?.workProcess as string | undefined) || '',
      hq_request: unified.hqRequest || '',
      issues: unified.issues || '',
      notes: unified.notes || '',
      created_by: unified.authorId,
      total_workers:
        (unified.meta?.totalWorkers as number | undefined) ?? unified.workers.length ?? 0,
    },
    workEntries: unified.workEntries || [],
    workerEntries: unified.workers || [],
    npc1000Materials: {
      incoming:
        unified.npcUsage?.incoming !== undefined ? String(unified.npcUsage?.incoming ?? '') : '',
      used: unified.npcUsage?.used !== undefined ? String(unified.npcUsage?.used ?? '') : '',
      remaining:
        unified.npcUsage?.remaining !== undefined ? String(unified.npcUsage?.remaining ?? '') : '',
    },
    additionalPhotos: unified.additionalPhotos || [],
  }
}
