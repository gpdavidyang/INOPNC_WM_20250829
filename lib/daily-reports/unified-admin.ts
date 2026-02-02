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
  primary_customer?: any
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
      uploadedByName: (() => {
        const p = Array.isArray(item?.profiles) ? item.profiles[0] : item?.profiles
        const u = item?.uploader || item?.creator || p
        const meta = (
          item?.metadata && typeof item.metadata === 'object' ? item.metadata : {}
        ) as any

        const fullName =
          item?.uploaded_by_name ||
          u?.full_name ||
          u?.name ||
          meta?.uploader_name ||
          meta?.uploader?.full_name ||
          meta?.uploaded_by_profile?.full_name
        if (fullName) return String(fullName)

        const email = u?.email || meta?.uploader?.email || meta?.uploader_email
        if (email) return String(email).split('@')[0]

        return undefined
      })(),
      uploader: Array.isArray(item?.profiles)
        ? item.profiles[0]
        : item?.profiles || item?.uploader || undefined,
      metadata: item?.metadata || undefined,
    }))

  return {
    photos: mapCategory(documents?.photo, 'photo'),
    drawings: mapCategory(documents?.drawing, 'drawing'),
    confirmations: mapCategory(documents?.completion, 'confirmation'),
    others: mapCategory(documents?.other, 'other'),
  }
}

const normalizeAdditionalPhoto = (
  photo: any,
  index: number,
  type: 'before' | 'after'
): AdditionalPhotoData => ({
  id: photo?.id || `photo-${type}-${index}`,
  file: undefined,
  url: photo?.url || photo?.file_url || null,
  path: photo?.storage_path || photo?.path || photo?.file_path || undefined,
  storage_path: photo?.storage_path || photo?.path || photo?.file_path || undefined,
  filename: photo?.filename || photo?.file_name || `photo-${type}-${index + 1}.jpg`,
  description: photo?.description || '',
  photo_type: type,
  file_size: photo?.file_size || undefined,
  upload_order: photo?.upload_order || photo?.order || index + 1,
  uploaded_by: photo?.uploaded_by || undefined,
  uploaded_at: photo?.uploaded_at || photo?.created_at || undefined,
  uploaded_by_name:
    photo?.uploaded_by_name ||
    photo?.uploader?.full_name ||
    photo?.uploaded_by_profile?.full_name ||
    photo?.profiles?.full_name ||
    undefined,
})

const mapAdditionalPhotos = (dailyReport: any): AdditionalPhotoData[] => {
  const before: AdditionalPhotoData[] = Array.isArray(dailyReport?.additional_before_photos)
    ? dailyReport.additional_before_photos.map((photo: any, index: number) =>
        normalizeAdditionalPhoto(photo, index, 'before')
      )
    : []

  const after: AdditionalPhotoData[] = Array.isArray(dailyReport?.additional_after_photos)
    ? dailyReport.additional_after_photos.map((photo: any, index: number) =>
        normalizeAdditionalPhoto(photo, index, 'after')
      )
    : []

  if (before.length === 0 && after.length === 0 && Array.isArray(dailyReport?.additional_photos)) {
    return dailyReport.additional_photos.map((photo: any, index: number) =>
      normalizeAdditionalPhoto(photo, index, photo?.photo_type === 'after' ? 'after' : 'before')
    )
  }

  return [...before, ...after].sort((a, b) => (a.upload_order || 0) - (b.upload_order || 0))
}

const mapWorkers = (workers: any[] | undefined): UnifiedWorkerEntry[] =>
  (workers || []).map((worker, index) => {
    // If labor_hours is provided, it is usually already in man-days (공수)
    // Legacy fields (hours, work_hours) might be in real hours (8h = 1.0)
    const laborHours = Number(worker?.labor_hours)
    const workHours = Number(worker?.hours ?? worker?.work_hours ?? 0)

    return {
      id: worker?.id || `worker-${index}`,
      workerId:
        worker?.profile_id ||
        worker?.worker_id ||
        worker?.user_id ||
        worker?.profiles?.id ||
        undefined,
      workerName:
        worker?.profiles?.full_name ||
        worker?.worker_name ||
        worker?.name ||
        worker?.workerName ||
        '이름없음',
      // If laborHours exists (>0), use it directly.
      // Otherwise, convert workHours to man-days (공수): 8 hours = 1.0
      hours:
        laborHours > 0
          ? Number(laborHours.toFixed(1))
          : workHours > 0
            ? Number((workHours / 8).toFixed(1))
            : 0,
      isDirectInput: worker?.isDirectInput ?? !worker?.worker_id,
      notes: worker?.notes || '',
    }
  })

const mapMaterials = (materials: any[] | undefined): UnifiedMaterialEntry[] =>
  (materials || []).map((material, index) => ({
    id: material?.id || `material-${index}`,
    materialId: material?.material_id || null,
    materialName: material?.material_name || material?.name || '자재',
    materialCode: material?.material_code || material?.material_type || null,
    quantity: Number(material?.quantity_val ?? material?.amount ?? material?.quantity ?? 0) || 0,
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

const mapTaskGroups = (dailyReport: any, locationData?: any): UnifiedTaskGroup[] | undefined => {
  // 1. Resolve work_content (it might be a string from the DB)
  let content = dailyReport.work_content
  if (typeof content === 'string' && content.trim()) {
    try {
      content = JSON.parse(content)
    } catch {
      content = {}
    }
  }
  if (!content || typeof content !== 'object') content = {}

  // 2. Give priority to structured Task arrays
  const structuredTasks = content.tasks || dailyReport.tasks || dailyReport.work_logs
  if (Array.isArray(structuredTasks) && structuredTasks.length > 0) {
    return structuredTasks.map((task: any) => ({
      memberTypes: ensureArray(task.memberTypes || task.component_type || task.memberName),
      workProcesses: ensureArray(
        task.workProcesses || task.processes || task.process_type || task.processType
      ),
      workTypes: ensureArray(task.workTypes || []),
      location: {
        block: task.location?.block || task.block || '',
        dong: task.location?.dong || task.dong || '',
        unit: task.location?.unit || task.unit || '',
      },
    }))
  }

  // 3. Flat DB Column Mapping as secondary source
  const componentName =
    dailyReport.component_name || dailyReport.member_name || content.memberTypes?.[0] || ''
  const workProcess =
    dailyReport.work_process || dailyReport.process_type || content.workProcesses?.[0] || ''
  const workSection = dailyReport.work_section || content.workTypes?.[0] || ''

  if (componentName || workProcess || workSection) {
    return [
      {
        memberTypes: [componentName].filter(Boolean) as string[],
        workProcesses: [workProcess].filter(Boolean) as string[],
        workTypes: [workSection].filter(Boolean) as string[],
        location: {
          block:
            locationData?.block ||
            dailyReport.location_info?.block ||
            dailyReport.location?.block ||
            content.location?.block ||
            '',
          dong:
            locationData?.dong ||
            dailyReport.location_info?.dong ||
            dailyReport.location?.dong ||
            content.location?.dong ||
            '',
          unit:
            locationData?.unit ||
            dailyReport.location_info?.unit ||
            dailyReport.location?.unit ||
            content.location?.unit ||
            '',
        },
      },
    ]
  }

  return undefined
}

export const integratedResponseToUnifiedReport = (
  response: AdminIntegratedResponse
): UnifiedDailyReport => {
  const dailyReport = response.daily_report || {}
  const attachments = mapDocumentsToAttachments(response.documents)
  const additionalPhotos = mapAdditionalPhotos(dailyReport)
  // Parse fields that might be stored as JSON strings
  let workContentData: any = dailyReport.work_content || {}
  if (typeof workContentData === 'string') {
    try {
      workContentData = JSON.parse(workContentData)
    } catch {
      workContentData = {}
    }
  }
  let locationData: any = dailyReport.location_info || {}
  if (typeof locationData === 'string') {
    try {
      locationData = JSON.parse(locationData)
    } catch {
      locationData = {}
    }
  }
  let additionalNotesData: any = dailyReport.additional_notes || {}
  if (typeof additionalNotesData === 'string') {
    try {
      additionalNotesData = JSON.parse(additionalNotesData)
    } catch {
      additionalNotesData = {}
    }
  }

  const workerSource =
    (Array.isArray(response.worker_assignments) && response.worker_assignments.length > 0
      ? response.worker_assignments
      : Array.isArray((dailyReport as any)?.worker_entries)
        ? (dailyReport as any).worker_entries
        : []) || []

  let workerAssignments = mapWorkers(workerSource)
  if (workerAssignments.length === 0 && Array.isArray(workContentData?.workers)) {
    workerAssignments = mapWorkers(workContentData.workers)
  }

  // Fallback: If no workers assigned but total_workers > 0, use author
  if (
    workerAssignments.length === 0 &&
    (response.worker_statistics?.total_workers || dailyReport.total_workers || 0) > 0
  ) {
    const authorName =
      response.report_author?.full_name || dailyReport.creator_profile?.full_name || '작성자'
    workerAssignments = [
      {
        id: 'author-fallback',
        workerId: dailyReport.created_by,
        workerName: authorName,
        hours: 8, // Default to a standard day
        isDirectInput: true,
        notes: '자동 배정 (내역 없음)',
      },
    ]
  }

  let materials = mapMaterials(response.material_usage || dailyReport.material_usage)
  if (materials.length === 0 && Array.isArray(workContentData?.materials)) {
    materials = mapMaterials(workContentData.materials)
  }

  const memberTypes = [dailyReport.component_name, dailyReport.member_name].filter(
    Boolean
  ) as string[]
  const workProcesses = [dailyReport.work_process, dailyReport.process_type].filter(
    Boolean
  ) as string[]
  const workTypes = [dailyReport.work_section].filter(Boolean) as string[]

  const workEntries = mapWorkEntries(dailyReport)
  const primaryEntry = workEntries[0]

  // Location logic: work_content > location_info > location > additional_notes > legacy
  let locationInfo = dailyReport.location_info || dailyReport.location
  if (typeof locationInfo === 'string') {
    try {
      locationInfo = JSON.parse(locationInfo)
    } catch {
      locationInfo = {}
    }
  }
  // Fallback to work_content.location (if exists) or additional_notes.location
  if (!locationInfo) {
    locationInfo =
      workContentData?.location_info ??
      workContentData?.location ??
      additionalNotesData?.location ??
      {}
  }

  const taskGroups = mapTaskGroups(dailyReport, locationData)

  // If top-level arrays are empty but we have tasks, backward populate them for display compatibility
  if (
    memberTypes.length === 0 &&
    workProcesses.length === 0 &&
    workTypes.length === 0 &&
    taskGroups &&
    taskGroups.length > 0
  ) {
    taskGroups.forEach(group => {
      if (group.memberTypes) memberTypes.push(...group.memberTypes)
      if (group.workProcesses) workProcesses.push(...group.workProcesses)
      if (group.workTypes) workTypes.push(...group.workTypes)
    })
  }

  return {
    id: dailyReport.id ? String(dailyReport.id) : undefined,
    siteId: dailyReport.site_id || '',
    siteName: response.site?.name || dailyReport?.sites?.name || dailyReport?.site?.name || '',
    partnerCompanyId: dailyReport.partner_company_id || undefined,
    partnerCompanyName:
      dailyReport.partner_companies?.company_name ||
      dailyReport.partner_company?.company_name ||
      dailyReport.customer_company?.company_name ||
      response.primaryCustomerName ||
      response.primary_customer?.name ||
      response.site?.organization?.name ||
      undefined,
    workDate: dailyReport.work_date || new Date().toISOString().split('T')[0],
    status: (dailyReport.status || 'draft') as UnifiedDailyReport['status'],
    authorId: dailyReport.created_by || undefined,
    authorName: response.report_author?.full_name || undefined,
    location: ensureLocation(locationInfo),
    memberTypes: Array.from(new Set(memberTypes)), // Deduplicate after populate
    workProcesses: Array.from(new Set(workProcesses)),
    workTypes: Array.from(new Set(workTypes)),
    workEntries,
    taskGroups,
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
      componentName: dailyReport.component_name || primaryEntry?.memberName || '',
      workProcess: dailyReport.work_process || primaryEntry?.processType || '',
      workSection: dailyReport.work_section || primaryEntry?.workSection || '',
      totalWorkers: response.worker_statistics?.total_workers,
      totalHours: response.worker_statistics?.total_hours,
      workContents: workContentData?.workContents ?? additionalNotesData?.workContents ?? [],
    },
    createdAt: dailyReport.created_at,
    updatedAt: dailyReport.updated_at,
    rejectionReason: dailyReport.rejection_reason || null,
    rejectedAt: dailyReport.rejected_at || null,
    rejectedBy: dailyReport.rejected_by || null,
  }
}
