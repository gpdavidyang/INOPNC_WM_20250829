import type {
  AdditionalPhotoData,
  UnifiedAttachments,
  UnifiedDailyReport,
  UnifiedMaterialEntry,
  UnifiedTaskGroup,
  UnifiedWorkEntry,
  UnifiedWorkerEntry,
} from '@/types/daily-reports'

export interface AdminIntegratedResponse {
  daily_report: any
  site?: any
  worker_assignments?: any[]
  worker_statistics?: {
    total_workers?: number
    total_hours?: number
    total_overtime?: number
    absent_workers?: number
    by_trade?: Record<string, number>
    by_skill?: Record<string, number>
  }
  documents?: Record<string, any[]>
  document_counts?: Record<string, number>
  related_reports?: any[]
  report_author?: any
}

const ensureArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => (item == null ? '' : String(item).trim())).filter(Boolean)
  }
  if (value == null) return []
  const text = String(value).trim()
  return text ? [text] : []
}

const ensureLocation = (info: any) => ({
  block: info?.block || '',
  dong: info?.dong || '',
  unit: info?.unit || '',
})

const mapDocumentsToAttachments = (documents?: Record<string, any[]>): UnifiedAttachments => {
  const mapCategory = (
    items: any[] | undefined,
    type: UnifiedAttachments[keyof UnifiedAttachments][number]['type']
  ) =>
    (items || []).map(item => ({
      id: item?.id || `${type}-${Math.random().toString(36).slice(2, 10)}`,
      type,
      name: item?.title || item?.file_name || '파일',
      url: item?.file_url || item?.url || '',
      size: item?.file_size || undefined,
      uploadedAt: item?.uploaded_at || item?.created_at || undefined,
      uploadedBy: item?.uploaded_by || undefined,
      metadata: item?.metadata || undefined,
    }))

  return {
    photos: mapCategory(documents?.photo, 'photo'),
    drawings: mapCategory(documents?.drawing, 'drawing'),
    confirmations: mapCategory(documents?.completion, 'confirmation'),
    others: mapCategory(documents?.other, 'other'),
  }
}

const mapAdditionalPhotos = (photos: any[] | undefined): AdditionalPhotoData[] =>
  (photos || []).map((photo, index) => ({
    id: photo?.id || `photo-${index}`,
    file: undefined,
    url: photo?.url || photo?.file_url || null,
    path: photo?.path || undefined,
    filename: photo?.filename || photo?.file_name || `photo-${index + 1}.jpg`,
    description: photo?.description || '',
    photo_type: photo?.photo_type === 'after' ? 'after' : 'before',
    file_size: photo?.file_size || undefined,
    upload_order: photo?.upload_order || index + 1,
    uploaded_by: photo?.uploaded_by || undefined,
    uploaded_at: photo?.uploaded_at || undefined,
  }))

const mapWorkers = (workers: any[] | undefined): UnifiedWorkerEntry[] =>
  (workers || []).map((worker, index) => ({
    id: worker?.id || `worker-${index}`,
    workerId: worker?.worker_id || worker?.profiles?.id || undefined,
    workerName: worker?.profiles?.full_name || worker?.worker_name || worker?.name || '이름없음',
    hours: Number(worker?.labor_hours ?? 0) || 0,
    isDirectInput: !worker?.worker_id,
    notes: worker?.notes || '',
  }))

const mapMaterials = (materials: any[] | undefined): UnifiedMaterialEntry[] =>
  (materials || []).map((material, index) => ({
    id: material?.id || `material-${index}`,
    materialId: material?.material_id || null,
    materialName: material?.material_name || '자재',
    materialCode: material?.material_code || material?.material_type || null,
    quantity: Number(material?.quantity ?? 0) || 0,
    unit: material?.unit || null,
    notes: material?.notes || null,
  }))

const mapWorkEntries = (dailyReport: any): UnifiedWorkEntry[] => {
  if (Array.isArray(dailyReport?.work_logs) && dailyReport.work_logs.length > 0) {
    return dailyReport.work_logs.map((log: any, index: number) => ({
      id: log?.id || `work-${index}`,
      memberName: log?.component_type || log?.member_name || '',
      memberNameOther: log?.component_type_other || '',
      processType: log?.process_type || '',
      processTypeOther: log?.process_type_other || '',
      workSection: log?.work_section || '',
      notes: log?.description || '',
    }))
  }

  return [
    {
      id: 'work-entry-primary',
      memberName: dailyReport?.component_name || dailyReport?.member_name || '',
      processType: dailyReport?.process_type || dailyReport?.work_process || '',
      workSection: dailyReport?.work_section || '',
      notes: dailyReport?.work_description || '',
    },
  ]
}

const mapTaskGroups = (dailyReport: any): UnifiedTaskGroup[] | undefined => {
  if (!Array.isArray(dailyReport?.work_logs) || dailyReport.work_logs.length === 0) {
    return undefined
  }

  return dailyReport.work_logs.map((log: any) => ({
    memberTypes: ensureArray(log?.component_type ? [log.component_type] : []),
    workProcesses: ensureArray(log?.process_type ? [log.process_type] : []),
    workTypes: ensureArray(log?.workTypes || []),
    location: {
      block: log?.location?.block || '',
      dong: log?.location?.dong || '',
      unit: log?.location?.unit || '',
    },
  }))
}

export const integratedResponseToUnifiedReport = (
  response: AdminIntegratedResponse
): UnifiedDailyReport => {
  const dailyReport = response.daily_report || {}
  const attachments = mapDocumentsToAttachments(response.documents)
  const additionalPhotos = mapAdditionalPhotos(dailyReport.additional_photos)
  const workerAssignments = mapWorkers(response.worker_assignments)
  const materials = mapMaterials(dailyReport.material_usage)

  const memberTypes = ensureArray(
    dailyReport.additional_notes?.memberTypes ?? dailyReport.member_name
  )
  const workProcesses = ensureArray(
    dailyReport.additional_notes?.workProcesses ?? dailyReport.process_type
  )
  const workTypes = ensureArray(dailyReport.additional_notes?.workTypes)

  return {
    id: dailyReport.id ? String(dailyReport.id) : undefined,
    siteId: dailyReport.site_id || '',
    siteName: response.site?.name || dailyReport?.sites?.name || dailyReport?.site?.name || '',
    partnerCompanyId: dailyReport.partner_company_id || undefined,
    partnerCompanyName: dailyReport.partner_company?.company_name || undefined,
    workDate: dailyReport.work_date || new Date().toISOString().split('T')[0],
    status: (dailyReport.status || 'draft') as UnifiedDailyReport['status'],
    authorId: dailyReport.created_by || undefined,
    authorName: response.report_author?.full_name || undefined,
    location: ensureLocation(dailyReport.location_info || {}),
    memberTypes,
    workProcesses,
    workTypes,
    workEntries: mapWorkEntries(dailyReport),
    taskGroups: mapTaskGroups(dailyReport),
    workers: workerAssignments,
    materials,
    npcUsage: dailyReport
      ? {
          incoming: dailyReport.npc1000_incoming ?? null,
          used: dailyReport.npc1000_used ?? null,
          remaining: dailyReport.npc1000_remaining ?? null,
        }
      : undefined,
    attachments,
    additionalPhotos,
    hqRequest: dailyReport.hq_request || '',
    notes: dailyReport.notes || '',
    progress: dailyReport.progress_rate ?? undefined,
    meta: {
      componentName: dailyReport.component_name,
      workProcess: dailyReport.work_process,
      workSection: dailyReport.work_section,
      totalWorkers: response.worker_statistics?.total_workers,
      totalHours: response.worker_statistics?.total_hours,
      workContents: dailyReport.additional_notes?.workContents || [],
    },
    createdAt: dailyReport.created_at,
    updatedAt: dailyReport.updated_at,
  }
}
