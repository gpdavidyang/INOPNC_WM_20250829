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
  static async getWorkLogs(filter?: WorkLogFilter, sort?: WorkLogSort): Promise<WorkLog[]> {
    try {
      let query = supabase.from('daily_reports').select(`
          id,
          work_date,
          site_id,
          sites!inner(name),
          work_content,
          location_info,
          additional_notes,
          progress_rate,
          status,
          created_at,
          updated_at,
          created_by,
          worker_assignments!inner(
            id,
            profile_id,
            labor_hours,
            profiles!inner(full_name)
          ),
          material_usage(
            material_type,
            quantity,
            unit
          ),
          document_attachments(
            id,
            file_name,
            file_url,
            file_size,
            document_type,
            uploaded_at
          )
        `)

      // 필터 적용
      if (filter?.status) {
        query = query.eq('status', filter.status)
      }
      if (filter?.siteId) {
        query = query.eq('site_id', filter.siteId)
      }
      if (filter?.dateFrom) {
        query = query.gte('work_date', filter.dateFrom)
      }
      if (filter?.dateTo) {
        query = query.lte('work_date', filter.dateTo)
      }

      // 정렬
      if (sort) {
        query = query.order(sort.field === 'date' ? 'work_date' : sort.field, {
          ascending: sort.order === 'asc',
        })
      } else {
        query = query.order('work_date', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        console.error('작업일지 조회 오류:', error)
        throw new Error('작업일지를 불러오는 중 오류가 발생했습니다.')
      }

      // 데이터 변환
      return this.transformToWorkLogs(data || [])
    } catch (error) {
      console.error('WorkLogService.getWorkLogs error:', error)
      throw error
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
      if (data.memberTypes || data.workProcesses || data.workTypes) {
        updateData.work_content = {
          memberTypes: data.memberTypes,
          workProcesses: data.workProcesses,
          workTypes: data.workTypes,
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

  /**
   * 데이터베이스 데이터를 WorkLog 타입으로 변환
   */
  private static transformToWorkLogs(data: any[]): WorkLog[] {
    return data.map(item => {
      const workContent = item.work_content || {}
      const workers =
        item.worker_assignments?.map((assignment: any) => ({
          id: assignment.profile_id || assignment.id,
          name: assignment.profiles?.full_name || assignment.worker_name || '미정',
          hours: (assignment.labor_hours || 0) * 8,
        })) || []

      const totalHours = workers.reduce((sum: number, worker: any) => sum + worker.hours, 0)

      // 첨부파일 분류
      const attachments = {
        photos: [],
        drawings: [],
        confirmations: [],
      }

      if (item.document_attachments) {
        item.document_attachments.forEach((doc: any) => {
          const file = {
            id: doc.id,
            url: doc.file_url,
            name: doc.file_name,
            size: doc.file_size,
            uploadedAt: doc.uploaded_at,
          }

          switch (doc.document_type) {
            case 'photo':
              attachments.photos.push(file)
              break
            case 'drawing':
              attachments.drawings.push(file)
              break
            case 'confirmation':
              attachments.confirmations.push(file)
              break
          }
        })
      }

      // NPC 사용량
      const npcMaterial = item.material_usage?.find((m: any) => m.material_type === 'NPC-1000')
      const npcUsage = npcMaterial
        ? {
            amount: npcMaterial.quantity,
            unit: npcMaterial.unit,
          }
        : undefined

      const status = item.status === 'approved' ? 'approved' : 'draft'

      const authorName = workers[0]?.name || item.created_by

      return {
        id: item.id,
        date: item.work_date,
        siteId: item.site_id,
        siteName: item.sites?.name || '알 수 없는 현장',
        title: item.title || item.sites?.name,
        author: authorName,
        status,
        memberTypes: workContent.memberTypes || [],
        workProcesses: workContent.workProcesses || [],
        workTypes: workContent.workTypes || [],
        location: item.location_info || { block: '', dong: '', unit: '' },
        workers,
        totalHours,
        npcUsage,
        attachments,
        progress: item.progress_rate || 0,
        notes: item.additional_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        createdBy: item.created_by,
      } as WorkLog
    })
  }
}
