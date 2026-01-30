// Mock dependencies
const STATUS_MAP: Record<string, string> = {
  draft: 'draft',
  saved: 'draft',
  submitted: 'submitted',
  pending: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
}

const ATTACHMENT_CATEGORY_MAP: Record<string, string> = {
  before_photo: 'before',
  after_photo: 'after',
  markup_drawing: 'markup',
  blueprint: 'markup',
  completion_document: 'completion',
  completion: 'completion',
}

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'draft'
  return STATUS_MAP[status] ?? 'draft'
}

function normalizeCategory(documentType: string | null | undefined): string {
  if (!documentType) return 'other'
  return ATTACHMENT_CATEGORY_MAP[documentType] ?? 'other'
}

function parseAdditionalNotes(notes: string | null | undefined) {
  if (!notes) return {}
  try {
    return JSON.parse(notes)
  } catch {
    return {}
  }
}

// Function to test (copied from worklog-api.ts with latest changes)
function mapReportToDetail(report: any): any {
  const noteData = parseAdditionalNotes(report.additional_notes)

  // Try to parse work_content (JSONB or stringified JSON)
  let workContent: any = {}
  if (report.work_content) {
    if (typeof report.work_content === 'string') {
      try {
        workContent = JSON.parse(report.work_content)
      } catch (e) {
        // use as empty object
      }
    } else {
      workContent = report.work_content
    }
  }

  // Prioritize work_content > additional_notes (legacy)
  let memberTypes: string[] = Array.isArray(workContent.memberTypes)
    ? workContent.memberTypes
    : Array.isArray(noteData.memberTypes)
      ? noteData.memberTypes
      : []

  // Legacy fallback: component_name column
  if (memberTypes.length === 0 && (report as any).component_name) {
    memberTypes = [(report as any).component_name]
  }

  let processes: string[] = Array.isArray(workContent.workProcesses)
    ? workContent.workProcesses
    : Array.isArray(noteData.workContents)
      ? noteData.workContents
      : []

  // Legacy fallback: work_process column
  if (processes.length === 0 && (report as any).work_process) {
    processes = [(report as any).work_process]
  }

  let workTypes: string[] = Array.isArray(workContent.workTypes)
    ? workContent.workTypes
    : Array.isArray(noteData.workTypes)
      ? noteData.workTypes
      : []

  // Legacy fallback: work_section column
  if (workTypes.length === 0 && (report as any).work_section) {
    workTypes = [(report as any).work_section]
  }

  const additionalManpower = Array.isArray(workContent.additionalManpower)
    ? workContent.additionalManpower
    : Array.isArray(noteData.additionalManpower)
      ? noteData.additionalManpower.map((item: any, index: number) => ({
          id: item?.id || `mp-${index}`,
          name: item?.name || item?.workerName || '추가 인력',
          manpower: Number(item?.manpower) || 0,
        }))
      : []

  const attachmentsRaw = report.document_attachments ?? []
  const attachments: any[] = attachmentsRaw.map((item: any) => ({
    id: item.id,
    name: item.file_name,
    type: 'document',
    category: normalizeCategory(item.document_type || undefined),
    previewUrl: undefined,
    fileUrl: item.file_url,
  }))

  const attachmentGroups = {
    photos: attachments.filter(item => item.category === 'before' || item.category === 'after'),
    drawings: attachments.filter(item => item.category === 'markup'),
    completionDocs: attachments.filter(item => item.category === 'completion'),
    others: attachments.filter(item => item.category === 'other'),
  }

  const totalManpower =
    typeof report.total_manpower === 'number'
      ? report.total_manpower
      : additionalManpower.reduce((sum: any, item: any) => sum + (item.manpower || 0), 0)

  // Location: report.location_info > noteData.location > empty
  // Handle potential stringified location_info
  let locationInfo: any = report.location_info
  if (typeof locationInfo === 'string') {
    try {
      locationInfo = JSON.parse(locationInfo)
    } catch {
      locationInfo = {}
    }
  }
  locationInfo = locationInfo ?? noteData.location ?? {}

  return {
    id: report.id,
    siteId: report.site_id ?? '',
    siteName: report.sites?.name ?? '현장 미지정',
    siteAddress: report.sites?.address ?? '',
    workDate: report.work_date,
    memberTypes,
    processes,
    workTypes,
    manpower: totalManpower,
    status: normalizeStatus(report.status),
    attachmentCounts: {
      photos: attachmentGroups.photos.length,
      drawings: attachmentGroups.drawings.length,
      completionDocs: attachmentGroups.completionDocs.length,
      others: attachmentGroups.others.length,
    },
    createdBy: {
      id: report.profiles?.id ?? report.created_by ?? '',
      name: report.profiles?.full_name ?? '작성자',
    },
    updatedAt: report.updated_at ?? report.created_at ?? new Date().toISOString(),
    location: {
      block: locationInfo.block ?? '',
      dong: locationInfo.dong ?? '',
      unit: locationInfo.unit ?? '',
    },
    notes: report.additional_notes || noteData.notes || '', // Fallback to raw if logic fails
    safetyNotes: noteData.safetyNotes ?? '',
    additionalManpower,
    attachments: attachmentGroups,
    // Add tasks if available in workContent
    tasks: Array.isArray(workContent.tasks) ? workContent.tasks : [],
  }
}

// Test Case
const mockReport = {
  id: 'test-id',
  site_id: 'site-1',
  work_date: '2026-01-30',
  status: 'submitted',
  work_content: null,
  location_info: undefined,
  additional_notes: JSON.stringify({
    memberTypes: ['슬라브'],
    workContents: ['면'], // Notice: check if key expects 'workContents' or 'workProcesses'
    workTypes: ['지상'],
    location: { block: '201', dong: '101', unit: '1' },
  }),
  sites: { name: 'Test Site', address: 'Address' },
  profiles: { full_name: 'Tester' },
}

const detail = mapReportToDetail(mockReport)

console.log('Member Types:', detail.memberTypes)
console.log('Location:', detail.location)

const success = detail.memberTypes.includes('슬라브') && detail.location.block === '201'
if (success) {
  console.log('SUCCESS: Parsing worked correctly from additional_notes.')
} else {
  console.log('FAILURE: Parsing failed.')
  console.log('WorkContents:', detail.processes)
}
