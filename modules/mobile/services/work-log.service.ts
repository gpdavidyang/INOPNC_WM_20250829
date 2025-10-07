import { createClient } from '@/lib/supabase/client'
import { WorkLog, WorkLogFilter, WorkLogSort, AttachedFile } from '../types/work-log.types'

const supabase = createClient()

export interface CreateWorkLogData {
  date: string
  siteId: string
  siteName: string
  memberTypes: string[]
  workProcesses: string[]
  workTypes: string[]
  location: {
    block: string
    dong: string
    unit: string
  }
  workers: Array<{
    name: string
    hours: number
  }>
  npcUsage?: {
    amount: number
    unit: string
  }
  progress: number
  notes?: string
  // 확장: 작업 세트 묶음(옵션). work_content.tasks로 저장
  tasks?: Array<{
    memberTypes: string[]
    workProcesses: string[]
    workTypes: string[]
    location: { block: string; dong: string; unit: string }
  }>
  attachments: {
    photos: AttachedFile[]
    drawings: AttachedFile[]
    confirmations: AttachedFile[]
  }
  status?: 'draft' | 'approved'
}

export interface UpdateWorkLogData extends Partial<CreateWorkLogData> {
  status?: 'draft' | 'approved'
}

/**
 * 작업일지 API 서비스
 */
export class WorkLogService {
  /**
   * 작업일지 목록 조회
   */
  static async getWorkLogs(
    filter?: WorkLogFilter,
    sort?: WorkLogSort,
    signal?: AbortSignal
  ): Promise<WorkLog[]> {
    const params = new URLSearchParams({ page: '1', limit: '200' })

    if (filter?.siteId) {
      params.set('site_id', filter.siteId)
    }
    if (filter?.dateFrom) {
      params.set('start_date', filter.dateFrom)
    }
    if (filter?.dateTo) {
      params.set('end_date', filter.dateTo)
    }
    if (filter?.status) {
      const statusValue = filter.status === 'approved' ? 'approved' : 'draft'
      params.set('status', statusValue)
    }

    // 1) Try mobile list (site_manager/worker scope)
    try {
      const response = await fetch(`/api/mobile/daily-reports?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        signal,
      })
      if (response.ok) {
        const payload = await response.json()
        const reports = Array.isArray(payload?.data?.reports) ? payload.data.reports : []
        const workLogs = this.transformToWorkLogs(reports)
        return sort ? this.sortWorkLogs(workLogs, sort) : workLogs
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return []
      // fallthrough to partner path
    }

    // 2) Fallback to partner list for partner/customer_manager scope
    try {
      const response = await fetch(`/api/partner/daily-reports?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        signal,
      })
      if (!response.ok) return []
      const payload = await response.json()
      const list = Array.isArray(payload?.data?.reports) ? payload.data.reports : []
      const workLogs = list.map((it: any) => ({
        id: String(it?.id),
        date: String(it?.workDate || it?.work_date || ''),
        siteId: String(it?.siteId || it?.site_id || ''),
        siteName: String(it?.siteName || it?.site_name || '현장'),
        partnerCompanyName: undefined,
        title: String(it?.siteName || it?.work_description || '작업일지'),
        author: '작성자',
        status: ['approved', 'submitted', 'completed'].includes(
          String(it?.status || '').toLowerCase()
        )
          ? ('approved' as const)
          : ('draft' as const),
        memberTypes: [],
        workProcesses: [],
        workTypes: [],
        location: { block: '', dong: '', unit: '' },
        workers: [],
        totalHours: 0,
        npcUsage: undefined,
        attachments: { photos: [], drawings: [], confirmations: [] },
        progress: 0,
        notes: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        createdBy: undefined,
      }))
      return sort ? this.sortWorkLogs(workLogs, sort) : workLogs
    } catch (e: any) {
      if (e?.name === 'AbortError') return []
      console.error('WorkLogService.getWorkLogs partner fallback error:', e)
      return []
    }
  }

  /**
   * 작업일지 생성
   */
  static async createWorkLog(data: CreateWorkLogData): Promise<WorkLog> {
    try {
      // 1. 일일 보고서 생성
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .insert({
          work_date: data.date,
          site_id: data.siteId,
          work_content: {
            memberTypes: data.memberTypes,
            workProcesses: data.workProcesses,
            workTypes: data.workTypes,
            tasks: data.tasks || [],
          },
          location_info: data.location,
          additional_notes: data.notes,
          progress_rate: data.progress,
          status: data.status ?? 'draft',
        })
        .select('id')
        .single()

      if (reportError) {
        throw new Error('일일 보고서 생성 실패: ' + reportError.message)
      }

      const reportId = reportData.id

      // 2. 작업자 배정 생성
      if (data.workers.length > 0) {
        const workerAssignments = data.workers.map(worker => ({
          daily_report_id: reportId,
          worker_name: worker.name,
          labor_hours: worker.hours / 8, // 시간을 공수로 변환
        }))

        const { error: workerError } = await supabase
          .from('worker_assignments')
          .insert(workerAssignments)

        if (workerError) {
          console.error('작업자 배정 생성 오류:', workerError)
        }
      }

      // 3. NPC 사용량 기록
      if (data.npcUsage) {
        const { error: materialError } = await supabase.from('material_usage').insert({
          daily_report_id: reportId,
          material_type: 'NPC-1000',
          quantity: data.npcUsage.amount,
          unit: data.npcUsage.unit,
        })

        if (materialError) {
          console.error('자재 사용량 기록 오류:', materialError)
        }

        // Apply usage to inventory/transactions (idempotent server-side)
        try {
          await fetch(`/api/mobile/daily-reports/${reportId}/materials/apply-usage`, {
            method: 'POST',
            credentials: 'include',
          })
        } catch (e) {
          console.warn('자재 사용량 반영 호출 실패(무시):', e)
        }
      }

      // 4. 첨부파일 업로드 및 기록
      await this.uploadAttachments(reportId, data.attachments)

      // 5. 생성된 작업일지 조회하여 반환
      const workLogs = await this.getWorkLogs({ siteId: data.siteId })
      const createdWorkLog = workLogs.find(log => log.id === reportId)

      if (!createdWorkLog) {
        throw new Error('생성된 작업일지를 찾을 수 없습니다.')
      }

      if ((data.status ?? 'draft') === 'approved') {
        await this.approveWorkLog(reportId)
        return { ...createdWorkLog, status: 'approved' }
      }

      return createdWorkLog
    } catch (error) {
      console.error('WorkLogService.createWorkLog error:', error)
      throw error
    }
  }

  /**
   * 작업일지 수정
   */
  static async updateWorkLog(id: string, data: UpdateWorkLogData): Promise<void> {
    try {
      const updateData: any = {}

      if (data.date) updateData.work_date = data.date
      if (data.siteId) updateData.site_id = data.siteId
      if (data.memberTypes || data.workProcesses || data.workTypes || data.tasks) {
        updateData.work_content = {
          memberTypes: data.memberTypes,
          workProcesses: data.workProcesses,
          workTypes: data.workTypes,
          tasks: data.tasks || [],
        }
      }
      if (data.location) updateData.location_info = data.location
      if (data.notes !== undefined) updateData.additional_notes = data.notes
      if (data.progress !== undefined) updateData.progress_rate = data.progress
      if (data.status) updateData.status = data.status

      const { error } = await supabase.from('daily_reports').update(updateData).eq('id', id)

      if (error) {
        throw new Error('작업일지 수정 실패: ' + error.message)
      }

      // 작업자 정보 업데이트
      if (data.workers) {
        // 기존 작업자 배정 삭제
        await supabase.from('worker_assignments').delete().eq('daily_report_id', id)

        // 새 작업자 배정 추가
        if (data.workers.length > 0) {
          const workerAssignments = data.workers.map(worker => ({
            daily_report_id: id,
            worker_name: worker.name,
            labor_hours: worker.hours / 8,
          }))

          await supabase.from('worker_assignments').insert(workerAssignments)
        }
      }

      // NPC 사용량 업데이트
      if (data.npcUsage) {
        await supabase.from('material_usage').upsert({
          daily_report_id: id,
          material_type: 'NPC-1000',
          quantity: data.npcUsage.amount,
          unit: data.npcUsage.unit,
        })

        // Apply updated usage to inventory/transactions
        try {
          await fetch(`/api/mobile/daily-reports/${id}/materials/apply-usage`, {
            method: 'POST',
            credentials: 'include',
          })
        } catch (e) {
          console.warn('자재 사용량 반영 호출 실패(무시):', e)
        }
      }

      // 첨부파일 업데이트
      if (data.attachments) {
        await this.uploadAttachments(id, data.attachments)
      }
    } catch (error) {
      console.error('WorkLogService.updateWorkLog error:', error)
      throw error
    }
  }

  /**
   * 작업일지 삭제
   */
  static async deleteWorkLog(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('daily_reports').delete().eq('id', id)

      if (error) {
        throw new Error('작업일지 삭제 실패: ' + error.message)
      }
    } catch (error) {
      console.error('WorkLogService.deleteWorkLog error:', error)
      throw error
    }
  }

  /**
   * 작업일지 승인
   */
  static async approveWorkLog(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('daily_reports')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        throw new Error('작업일지 승인 실패: ' + error.message)
      }
    } catch (error) {
      console.error('WorkLogService.approveWorkLog error:', error)
      throw error
    }
  }

  /**
   * 첨부파일 업로드 및 기록
   */
  private static async uploadAttachments(
    reportId: string,
    attachments: CreateWorkLogData['attachments']
  ): Promise<void> {
    try {
      const allFiles = [
        ...attachments.photos.map(f => ({ ...f, type: 'photo' })),
        ...attachments.drawings.map(f => ({ ...f, type: 'drawing' })),
        ...attachments.confirmations.map(f => ({ ...f, type: 'confirmation' })),
      ]

      if (allFiles.length === 0) return

      const fileRecords = allFiles.map(file => ({
        daily_report_id: reportId,
        file_name: file.name,
        file_url: file.url,
        file_size: file.size,
        document_type: file.type,
        uploaded_at: file.uploadedAt,
      }))

      const { error } = await supabase.from('document_attachments').insert(fileRecords)

      if (error) {
        console.error('첨부파일 기록 오류:', error)
      }
    } catch (error) {
      console.error('WorkLogService.uploadAttachments error:', error)
    }
  }

  static transformToWorkLogs(data: any[]): WorkLog[] {
    return transformToWorkLogs(data)
  }

  static sortWorkLogs(workLogs: WorkLog[], sort: WorkLogSort): WorkLog[] {
    return sortWorkLogs(workLogs, sort)
  }
}

function transformToWorkLogs(data: any[]): WorkLog[] {
  return data.map(item => mapReportToWorkLog(item))
}

function mapReportToWorkLog(item: any): WorkLog {
  const workContent = parseWorkContent(item?.work_content)
  const location = parseLocationInfo(item?.location_info)
  const workers = mapWorkerAssignments(item?.worker_assignments)
  const attachments = mapAttachments(item?.document_attachments)
  const npcUsage = extractNpcUsage(item?.material_usage)
  const totalHours = workers.reduce((sum, worker) => sum + worker.hours, 0)

  const status = resolveStatus(item?.status)

  const profileRelation = normalizeProfileRelation(item)
  const authorName =
    profileRelation?.full_name ||
    profileRelation?.name ||
    workers[0]?.name ||
    (isLikelyUuid(item?.created_by) ? '알 수 없는 작성자' : item?.created_by) ||
    '알 수 없는 작성자'

  const siteRelation = normalizeSiteRelation(item)
  const siteName =
    siteRelation?.name ||
    siteRelation?.site_name ||
    item?.site_name ||
    item?.site_label ||
    '알 수 없는 현장'

  return {
    id: item?.id,
    date: item?.work_date,
    siteId: item?.site_id,
    siteName,
    partnerCompanyName: item?.partner_company_name || item?.partnerCompanyName || undefined,
    title: item?.title || siteName || item?.work_description,
    author: authorName,
    status,
    memberTypes: workContent.memberTypes,
    workProcesses: workContent.workProcesses,
    workTypes: workContent.workTypes,
    tasks: workContent.tasks || undefined,
    location,
    workers,
    totalHours,
    npcUsage,
    attachments,
    progress: item?.progress_rate ?? item?.progress ?? 0,
    notes: item?.additional_notes ?? item?.special_notes ?? item?.notes ?? undefined,
    createdAt: item?.created_at,
    updatedAt: item?.updated_at,
    createdBy: item?.created_by,
  }
}

function parseWorkContent(raw: unknown): {
  memberTypes: string[]
  workProcesses: string[]
  workTypes: string[]
  tasks?: Array<{
    memberTypes: string[]
    workProcesses: string[]
    workTypes: string[]
    location: { block: string; dong: string; unit: string }
  }>
} {
  if (!raw) {
    return { memberTypes: [], workProcesses: [], workTypes: [] }
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return {
        memberTypes: Array.isArray(parsed?.memberTypes) ? parsed.memberTypes : [],
        workProcesses: Array.isArray(parsed?.workProcesses) ? parsed.workProcesses : [],
        workTypes: Array.isArray(parsed?.workTypes) ? parsed.workTypes : [],
        tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : undefined,
      }
    } catch (error) {
      console.warn('Failed to parse work_content JSON:', error)
      return { memberTypes: [], workProcesses: [], workTypes: [] }
    }
  }

  return {
    memberTypes: Array.isArray((raw as any)?.memberTypes) ? (raw as any).memberTypes : [],
    workProcesses: Array.isArray((raw as any)?.workProcesses) ? (raw as any).workProcesses : [],
    workTypes: Array.isArray((raw as any)?.workTypes) ? (raw as any).workTypes : [],
    tasks: Array.isArray((raw as any)?.tasks) ? (raw as any).tasks : undefined,
  }
}

function parseLocationInfo(raw: unknown): {
  block: string
  dong: string
  unit: string
} {
  if (!raw || typeof raw !== 'object') {
    return { block: '', dong: '', unit: '' }
  }

  return {
    block: toSafeString((raw as any).block),
    dong: toSafeString((raw as any).dong),
    unit: toSafeString((raw as any).unit),
  }
}

function mapWorkerAssignments(assignments: any[]): {
  id: string
  name: string
  hours: number
  role?: string
}[] {
  if (!Array.isArray(assignments)) {
    return []
  }

  return assignments.map(assignment => {
    const hours = Number(assignment?.labor_hours ?? 0) * 8
    const profileData = assignment?.profiles
    const profileName = Array.isArray(profileData)
      ? profileData[0]?.full_name
      : profileData?.full_name
    const fallbackName = assignment?.worker_name || profileName || '미정'

    return {
      id: assignment?.profile_id || assignment?.id,
      name: profileName || fallbackName,
      hours: Number.isFinite(hours) ? hours : 0,
    }
  })
}

function mapAttachments(attachments: any[]): {
  photos: AttachedFile[]
  drawings: AttachedFile[]
  confirmations: AttachedFile[]
} {
  const initial = {
    photos: [] as AttachedFile[],
    drawings: [] as AttachedFile[],
    confirmations: [] as AttachedFile[],
  }

  if (!Array.isArray(attachments)) {
    return initial
  }

  attachments.forEach(attachment => {
    const file: AttachedFile = {
      id: attachment?.id,
      url: attachment?.file_url,
      name: attachment?.file_name,
      size: attachment?.file_size ?? 0,
      uploadedAt: attachment?.uploaded_at,
    }

    switch (attachment?.document_type) {
      case 'drawing':
        initial.drawings.push(file)
        break
      case 'confirmation':
        initial.confirmations.push(file)
        break
      default:
        initial.photos.push(file)
        break
    }
  })

  return initial
}

function extractNpcUsage(materials: any[]):
  | {
      amount: number
      unit: string
    }
  | undefined {
  if (!Array.isArray(materials)) {
    return undefined
  }

  const npcMaterial = materials.find(material => {
    const type = String(material?.material_type || '').toUpperCase()
    return type === 'NPC-1000'
  })

  if (!npcMaterial) {
    return undefined
  }

  return {
    amount: Number(npcMaterial?.quantity ?? 0),
    unit: npcMaterial?.unit || '',
  }
}

function resolveStatus(rawStatus: string | null | undefined): 'draft' | 'approved' {
  if (!rawStatus) {
    return 'draft'
  }

  const normalized = rawStatus.toLowerCase()

  if (['approved', 'completed', 'submitted'].includes(normalized)) {
    return 'approved'
  }

  return 'draft'
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function sortWorkLogs(workLogs: WorkLog[], sort: WorkLogSort): WorkLog[] {
  const sorted = [...workLogs]

  sorted.sort((a, b) => {
    let aValue: unknown = a[sort.field]
    let bValue: unknown = b[sort.field]

    switch (sort.field) {
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'siteName':
        aValue = a.siteName?.toLowerCase() || ''
        bValue = b.siteName?.toLowerCase() || ''
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'progress':
        aValue = a.progress ?? 0
        bValue = b.progress ?? 0
        break
    }

    if (aValue < bValue) return sort.order === 'asc' ? -1 : 1
    if (aValue > bValue) return sort.order === 'asc' ? 1 : -1
    return 0
  })

  return sorted
}

function normalizeProfileRelation(item: any): { full_name?: string; name?: string } | undefined {
  const candidates = [
    item?.profiles,
    item?.profile,
    item?.created_by_profile,
    item?.author_profile,
    item?.submitted_by_profile,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (Array.isArray(candidate)) {
      if (candidate[0]) {
        return candidate[0]
      }
    } else if (typeof candidate === 'object') {
      return candidate
    }
  }

  return undefined
}

function normalizeSiteRelation(item: any): { name?: string; site_name?: string } | undefined {
  const candidates = [item?.sites, item?.site, item?.site_info, item?.site_detail]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (Array.isArray(candidate)) {
      if (candidate[0]) {
        return candidate[0]
      }
    } else if (typeof candidate === 'object') {
      return candidate
    }
  }

  return undefined
}

function isLikelyUuid(value: unknown): boolean {
  return typeof value === 'string'
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    : false
}

// Backwards compatibility for legacy static references
;(
  WorkLogService as unknown as {
    transformToWorkLogs: typeof transformToWorkLogs
    sortWorkLogs: typeof sortWorkLogs
  }
).transformToWorkLogs = transformToWorkLogs
;(
  WorkLogService as unknown as {
    transformToWorkLogs: typeof transformToWorkLogs
    sortWorkLogs: typeof sortWorkLogs
  }
).sortWorkLogs = sortWorkLogs
