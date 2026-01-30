'use client'

import type {
  WorklogAttachment,
  WorklogCalendarCell,
  WorklogDetail,
  WorklogStatus,
  WorklogSummary,
} from '@/types/worklog'
import { addDays, endOfMonth, format, parseISO, startOfMonth, subMonths } from 'date-fns'

export type WorklogPeriod = 'recent' | 'month' | 'quarter' | 'all'

export interface WorklogListParams {
  siteId?: string
  period?: WorklogPeriod
  statuses?: WorklogStatus[]
  query?: string
  referenceDate?: string
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: unknown
}

interface ApiDailyReport {
  id: string
  site_id: string | null
  work_date: string
  status: string
  total_manpower?: number | null
  work_content?: string | null
  additional_notes?: string | null
  location_info?: any
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  sites?: {
    id?: string | null
    name?: string | null
    address?: string | null
  } | null
  profiles?: {
    id?: string | null
    full_name?: string | null
  } | null
  document_attachments?: Array<{
    id: string
    file_name: string
    file_url: string
    document_type?: string | null
    uploaded_at?: string | null
  }>
  material_usage?: Array<{
    id: string
    material_type?: string | null
    material_name?: string | null
    quantity?: number | null
    unit?: string | null
    notes?: string | null
  }>
}

interface WorklogListApiPayload {
  reports?: ApiDailyReport[]
}

export interface WorklogListResult {
  summaries: WorklogSummary[]
  detailMap: Record<string, WorklogDetail>
}

const STATUS_MAP: Record<string, WorklogStatus> = {
  draft: 'draft',
  saved: 'draft',
  submitted: 'submitted',
  pending: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
}

const ATTACHMENT_CATEGORY_MAP: Record<string, WorklogAttachment['category']> = {
  before_photo: 'before',
  after_photo: 'after',
  markup_drawing: 'markup',
  blueprint: 'markup',
  completion_document: 'completion',
  completion: 'completion',
}

function normalizeStatus(status: string | null | undefined): WorklogStatus {
  if (!status) return 'draft'
  return STATUS_MAP[status] ?? 'draft'
}

function normalizeCategory(documentType: string | null | undefined): WorklogAttachment['category'] {
  if (!documentType) return 'other'
  return ATTACHMENT_CATEGORY_MAP[documentType] ?? 'other'
}

function parseAdditionalNotes(notes: string | object | null | undefined) {
  if (!notes) return {}
  if (typeof notes === 'object') return notes
  try {
    return JSON.parse(notes)
  } catch {
    return {}
  }
}

function mapReportToDetail(report: ApiDailyReport): WorklogDetail {
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
  const attachments: WorklogAttachment[] = attachmentsRaw.map(item => ({
    id: item.id,
    name: item.file_name,
    type: 'document',
    category: normalizeCategory(item.document_type || undefined),
    previewUrl: undefined,
    fileUrl: item.file_url,
  }))

  const attachmentGroups: WorklogDetail['attachments'] = {
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
    materials: (report.material_usage || []).map(m => ({
      material_id: m.id,
      material_name: m.material_name || '',
      material_code: m.material_type || null,
      quantity: m.quantity || 0,
      unit: m.unit || '',
      notes: m.notes || '',
    })),
  }
}

function detailToSummary(detail: WorklogDetail): WorklogSummary {
  return {
    id: detail.id,
    siteId: detail.siteId,
    siteName: detail.siteName,
    workDate: detail.workDate,
    memberTypes: detail.memberTypes,
    processes: detail.processes,
    workTypes: detail.workTypes,
    manpower: detail.manpower,
    status: detail.status,
    attachmentCounts: detail.attachmentCounts,
    createdBy: detail.createdBy,
    updatedAt: detail.updatedAt,
  }
}

function buildQueryParams(params: WorklogListParams): URLSearchParams {
  const search = new URLSearchParams()
  if (params.siteId && params.siteId !== 'all') {
    search.set('site_id', params.siteId)
  }

  const referenceDate = params.referenceDate ? parseISO(params.referenceDate) : new Date()
  const period = params.period ?? 'recent'

  switch (period) {
    case 'recent': {
      const end = new Date()
      const start = addDays(end, -6)
      search.set('start_date', format(start, 'yyyy-MM-dd'))
      search.set('end_date', format(end, 'yyyy-MM-dd'))
      break
    }
    case 'month': {
      const start = startOfMonth(referenceDate)
      const end = endOfMonth(referenceDate)
      search.set('start_date', format(start, 'yyyy-MM-dd'))
      search.set('end_date', format(end, 'yyyy-MM-dd'))
      break
    }
    case 'quarter': {
      const start = subMonths(startOfMonth(referenceDate), 2)
      const end = endOfMonth(referenceDate)
      search.set('start_date', format(start, 'yyyy-MM-dd'))
      search.set('end_date', format(end, 'yyyy-MM-dd'))
      break
    }
    case 'all':
    default:
      break
  }

  if (params.statuses && params.statuses.length === 1) {
    search.set('status', params.statuses[0])
  }

  search.set('limit', '100')
  return search
}

function postFilterDetail(detail: WorklogDetail, params: WorklogListParams): boolean {
  if (params.statuses && params.statuses.length > 1 && !params.statuses.includes(detail.status)) {
    return false
  }

  if (params.query) {
    const q = params.query.trim().toLowerCase()
    if (q) {
      const haystack = [
        detail.siteName,
        detail.memberTypes.join(' '),
        detail.processes.join(' '),
        detail.workTypes.join(' '),
        detail.createdBy.name,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) {
        return false
      }
    }
  }

  return true
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  })

  const json = (await response.json()) as ApiResponse<T>

  if (!response.ok || json.error) {
    throw new Error((json.error as string) || '작업일지 데이터를 불러오지 못했습니다.')
  }

  return json.data as T
}

export async function fetchWorklogList(params: WorklogListParams): Promise<WorklogListResult> {
  const search = buildQueryParams(params)
  const payload = await fetchJson<WorklogListApiPayload>(
    `/api/mobile/daily-reports?${search.toString()}`
  )
  const reports = payload.reports ?? []

  const detailMap: Record<string, WorklogDetail> = {}
  const summaries: WorklogSummary[] = []

  reports.forEach(report => {
    const detail = mapReportToDetail(report)
    if (!postFilterDetail(detail, params)) {
      return
    }
    detailMap[detail.id] = detail
    summaries.push(detailToSummary(detail))
  })

  return { summaries, detailMap }
}

export async function fetchWorklogCalendar(params: {
  month: string
  siteId?: string
}): Promise<WorklogCalendarCell[]> {
  const monthDate = parseISO(params.month)
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)

  const listResult = await fetchWorklogList({
    siteId: params.siteId,
    period: 'all',
    referenceDate: params.month,
    statuses: [],
    query: '',
  })

  const counts = new Map<string, WorklogCalendarCell>()

  Object.values(listResult.detailMap).forEach(detail => {
    const date = parseISO(detail.workDate)
    if (date < start || date > end) return

    const existing = counts.get(detail.workDate) ?? {
      date: detail.workDate,
      total: 0,
      submitted: 0,
      draft: 0,
    }

    existing.total += 1
    if (detail.status === 'draft') existing.draft += 1
    if (detail.status === 'submitted' || detail.status === 'approved') existing.submitted += 1
    counts.set(detail.workDate, existing)
  })

  return Array.from(counts.values())
}

export type WorklogDetailMap = Record<string, WorklogDetail>
