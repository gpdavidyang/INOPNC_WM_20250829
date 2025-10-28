import type {
  AdditionalPhotoData,
  UnifiedAttachment,
  UnifiedAttachments,
  UnifiedDailyReport,
  UnifiedMaterialEntry,
  UnifiedTaskGroup,
  UnifiedWorkerEntry,
} from '@/types/daily-reports'
import type {
  WorkLog,
  MaterialUsageEntry,
  WorkerHours,
} from '@/modules/mobile/types/work-log.types'
import type {
  CreateWorkLogData,
  UpdateWorkLogData,
} from '@/modules/mobile/services/work-log.service'

const ensureString = (value: unknown, fallback = '') =>
  value === undefined || value === null ? fallback : String(value)

const ensureNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const buildAttachments = (attachments: WorkLog['attachments']): UnifiedAttachments => {
  const map = (files: any[] = [], type: UnifiedAttachment['type']) =>
    files.map(file => ({
      id: file?.id || `${type}-${Math.random().toString(36).slice(2, 10)}`,
      type,
      name: file?.name || '파일',
      url: file?.url || '',
      size: file?.size || undefined,
      uploadedAt: file?.uploadedAt || undefined,
      uploadedBy: file?.uploadedBy || undefined,
      metadata: undefined,
    }))

  return {
    photos: map(attachments?.photos, 'photo'),
    drawings: map(attachments?.drawings, 'drawing'),
    confirmations: map(attachments?.confirmations, 'confirmation'),
    others: [],
  }
}

export const modalStateToUnifiedReport = ({
  formData,
  tasks,
  materials,
  attachments,
  status,
  existingId,
}: {
  formData: Partial<WorkLog>
  tasks: Array<{
    memberTypes: string[]
    workProcesses: string[]
    workTypes: string[]
    location: { block: string; dong: string; unit: string }
  }>
  materials: Array<MaterialUsageEntry & { material_name: string }>
  attachments: WorkLog['attachments']
  status: 'draft' | 'approved'
  existingId?: string
}): UnifiedDailyReport =>
  ({
    id: existingId,
    siteId: ensureString(formData.siteId),
    siteName: formData.siteName || '',
    workDate: ensureString(formData.date, new Date().toISOString().split('T')[0]),
    status,
    location: {
      block: ensureString(formData.location?.block),
      dong: ensureString(formData.location?.dong),
      unit: ensureString(formData.location?.unit),
    },
    memberTypes: formData.memberTypes || [],
    workProcesses: formData.workProcesses || [],
    workTypes: formData.workTypes || [],
    workEntries: [
      {
        id: 'task-0',
        memberName: formData.memberTypes?.[0] || '',
        processType: formData.workProcesses?.[0] || '',
        workSection: `${ensureString(formData.location?.block)} ${ensureString(
          formData.location?.dong
        )} ${ensureString(formData.location?.unit)}`.trim(),
      },
    ],
    taskGroups: tasks.map(task => ({
      memberTypes: task.memberTypes || [],
      workProcesses: task.workProcesses || [],
      workTypes: task.workTypes || [],
      location: {
        block: ensureString(task.location?.block),
        dong: ensureString(task.location?.dong),
        unit: ensureString(task.location?.unit),
      },
    })) as UnifiedTaskGroup[],
    workers: (formData.workers || []).map(
      worker =>
        ({
          id: worker.id || `worker-${Math.random().toString(36).slice(2, 10)}`,
          workerId: worker.id,
          workerName: worker.name || '작업자',
          hours: ensureNumber(worker.hours, 0),
          isDirectInput: true,
          notes: '',
        }) as UnifiedWorkerEntry
    ),
    materials: materials.map(
      (material, index) =>
        ({
          id: `material-${index}`,
          materialId: material.material_code || null,
          materialName: material.material_name,
          materialCode: material.material_code || null,
          quantity: ensureNumber(material.quantity, 0),
          unit: material.unit || null,
          notes: material.notes || null,
        }) as UnifiedMaterialEntry
    ),
    npcUsage: undefined,
    attachments: buildAttachments(attachments),
    additionalPhotos: [],
    hqRequest: undefined,
    issues: formData.notes || '',
    notes: formData.notes || '',
    progress: formData.progress ?? 0,
    meta: {},
  }) as UnifiedDailyReport

const mapAttachmentsToMobile = (
  attachments: UnifiedAttachments
): CreateWorkLogData['attachments'] => {
  const map = (files: UnifiedAttachment[]) =>
    files.map(file => ({
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size ?? 0,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
    }))

  return {
    photos: map(attachments.photos || []),
    drawings: map(attachments.drawings || []),
    confirmations: map(attachments.confirmations || []),
  }
}

const mapWorkersToMobile = (workers: UnifiedWorkerEntry[]): WorkerHours[] =>
  workers.map(worker => ({
    id: worker.workerId || worker.id,
    name: worker.workerName || '작업자',
    hours: ensureNumber(worker.hours, 0),
  }))

const mapMaterialsToMobile = (materials: UnifiedMaterialEntry[]): MaterialUsageEntry[] =>
  materials.map(material => ({
    material_name: material.materialName,
    material_code: material.materialCode || null,
    quantity: ensureNumber(material.quantity, 0),
    unit: material.unit || null,
    notes: material.notes || null,
  }))

const mapTasksForMobile = (report: UnifiedDailyReport): CreateWorkLogData['tasks'] => {
  if (report.taskGroups && report.taskGroups.length > 0) {
    return report.taskGroups.map(task => ({
      memberTypes: task.memberTypes || [],
      workProcesses: task.workProcesses || [],
      workTypes: task.workTypes || [],
      location: {
        block: ensureString(task.location?.block),
        dong: ensureString(task.location?.dong),
        unit: ensureString(task.location?.unit),
      },
    }))
  }

  return [
    {
      memberTypes: report.memberTypes || [],
      workProcesses: report.workProcesses || [],
      workTypes: report.workTypes || [],
      location: {
        block: ensureString(report.location?.block),
        dong: ensureString(report.location?.dong),
        unit: ensureString(report.location?.unit),
      },
    },
  ]
}

export const unifiedReportToMobileCreatePayload = (
  report: UnifiedDailyReport
): CreateWorkLogData => ({
  date: report.workDate,
  siteId: report.siteId,
  siteName: report.siteName || '',
  memberTypes: report.memberTypes || [],
  workProcesses: report.workProcesses || [],
  workTypes: report.workTypes || [],
  location: {
    block: ensureString(report.location?.block),
    dong: ensureString(report.location?.dong),
    unit: ensureString(report.location?.unit),
  },
  workers: mapWorkersToMobile(report.workers || []),
  materials: mapMaterialsToMobile(report.materials || []),
  progress: report.progress ?? 0,
  notes: report.notes || '',
  tasks: mapTasksForMobile(report),
  attachments: mapAttachmentsToMobile(report.attachments),
  status: report.status === 'approved' ? 'approved' : 'draft',
})

export const unifiedReportToMobileUpdatePayload = (
  report: UnifiedDailyReport
): UpdateWorkLogData => ({
  date: report.workDate,
  siteId: report.siteId,
  memberTypes: report.memberTypes || [],
  workProcesses: report.workProcesses || [],
  workTypes: report.workTypes || [],
  tasks: mapTasksForMobile(report),
  location: {
    block: ensureString(report.location?.block),
    dong: ensureString(report.location?.dong),
    unit: ensureString(report.location?.unit),
  },
  workers: mapWorkersToMobile(report.workers || []),
  materials: mapMaterialsToMobile(report.materials || []),
  progress: report.progress ?? 0,
  notes: report.notes || '',
  attachments: mapAttachmentsToMobile(report.attachments),
  status: report.status === 'approved' ? 'approved' : 'draft',
})

export const workLogToUnifiedReport = (workLog: WorkLog): UnifiedDailyReport => ({
  id: workLog.id,
  siteId: workLog.siteId,
  siteName: workLog.siteName,
  workDate: workLog.date,
  status: workLog.status === 'approved' ? 'approved' : 'draft',
  location: {
    block: ensureString(workLog.location?.block),
    dong: ensureString(workLog.location?.dong),
    unit: ensureString(workLog.location?.unit),
  },
  memberTypes: workLog.memberTypes || [],
  workProcesses: workLog.workProcesses || [],
  workTypes: workLog.workTypes || [],
  workEntries: [
    {
      id: 'task-0',
      memberName: workLog.memberTypes?.[0] || '',
      processType: workLog.workProcesses?.[0] || '',
      workSection: `${ensureString(workLog.location?.block)} ${ensureString(
        workLog.location?.dong
      )} ${ensureString(workLog.location?.unit)}`.trim(),
      notes: workLog.notes || '',
    },
  ],
  taskGroups: workLog.tasks
    ? workLog.tasks.map(task => ({
        memberTypes: task.memberTypes || [],
        workProcesses: task.workProcesses || [],
        workTypes: task.workTypes || [],
        location: {
          block: ensureString(task.location?.block),
          dong: ensureString(task.location?.dong),
          unit: ensureString(task.location?.unit),
        },
      }))
    : undefined,
  workers: (workLog.workers || []).map(worker => ({
    id: worker.id || `worker-${Math.random().toString(36).slice(2, 10)}`,
    workerId: worker.id,
    workerName: worker.name || '작업자',
    hours: ensureNumber(worker.hours, 0),
    isDirectInput: true,
    notes: '',
  })),
  materials: mapMaterialsToMobile(workLog.materials || []).map((material, index) => ({
    id: `material-${index}`,
    materialId: material.material_code || null,
    materialName: material.material_name,
    materialCode: material.material_code || null,
    quantity: ensureNumber(material.quantity, 0),
    unit: material.unit || null,
    notes: material.notes || null,
  })),
  npcUsage: undefined,
  attachments: buildAttachments(workLog.attachments),
  additionalPhotos: [],
  hqRequest: undefined,
  issues: workLog.notes || '',
  safetyNotes: undefined,
  notes: workLog.notes || '',
  progress: workLog.progress ?? 0,
  meta: {},
})
