'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  DailyReport, 
  DailyReportStatus, 
  WorkLog, 
  AttendanceRecord,
  Material,
  WorkLogMaterial
} from '@/types'
import { AdditionalPhotoData } from '@/types/daily-reports'
import { revalidatePath } from 'next/cache'
import { 
  AppError, 
  ErrorType, 
  validateSupabaseResponse, 
  logError,
  handleAsync 
} from '@/lib/error-handling'
import {
  notifyDailyReportSubmitted,
  notifyDailyReportApproved,
  notifyDailyReportRejected
} from '@/lib/notifications/triggers'

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function createHeadquartersRequest(
  supabase: any, 
  requesterId: string, 
  siteId: string, 
  content: string, 
  workDate: string
) {
  try {
    const { error } = await supabase
      .from('headquarters_requests')
      .insert({
        requester_id: requesterId,
        site_id: siteId,
        category: 'general',
        subject: `${workDate} 작업일지 본사 요청사항`,
        content: content,
        urgency: 'medium',
        status: 'pending',
        request_date: workDate,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error creating headquarters request:', error)
      // Don't throw error to avoid breaking daily report creation
    }
  } catch (error) {
    console.error('Failed to create headquarters request:', error)
    // Don't throw error to avoid breaking daily report creation
  }
}

// ==========================================
// DAILY REPORT ACTIONS
// ==========================================

export async function createDailyReport(data: {
  site_id: string
  work_date: string
  member_name: string
  process_type: string // Required field in actual DB
  total_workers?: number
  npc1000_incoming?: number
  npc1000_used?: number
  npc1000_remaining?: number
  issues?: string
  hq_request?: string
}, workerDetails?: Array<{worker_name: string, labor_hours: number, worker_id?: string}>) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    // Check if report already exists for this date and user
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id, status')
      .eq('site_id', data.site_id)
      .eq('work_date', data.work_date)
      .eq('created_by', user.id)
      .single()

    // If report exists, update it instead of creating new one
    if (existing) {
      const { data: report, error } = await supabase
        .from('daily_reports')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      validateSupabaseResponse(report, error)

      // Update worker details if provided
      if (workerDetails && report) {
        // Delete existing worker details
        await supabase
          .from('daily_report_workers')
          .delete()
          .eq('daily_report_id', report.id)

        // Insert new worker details
        if (workerDetails.length > 0) {
          const workerInserts = workerDetails
            .filter(worker => worker.worker_name && worker.labor_hours > 0)
            .map(worker => ({
              daily_report_id: report.id,
              worker_name: worker.worker_name,
              work_hours: worker.labor_hours,
              created_at: new Date().toISOString()
            }))

          if (workerInserts.length > 0) {
            const { error: workerError } = await supabase
              .from('daily_report_workers')
              .insert(workerInserts)

            if (workerError) {
              console.error('Error saving worker details:', workerError)
            }
          }
        }
      }

      // Handle headquarters request if provided
      if (data.hq_request && data.hq_request.trim() && report) {
        await createHeadquartersRequest(supabase, user.id, data.site_id, data.hq_request, data.work_date)
      }

      revalidatePath('/dashboard/daily-reports')
      return { success: true, data: report }
    }

    // Create new daily report
    const { data: report, error } = await supabase
      .from('daily_reports')
      .insert({
        ...data,
        status: 'draft' as DailyReportStatus,
        created_by: user.id
      })
      .select()
      .single()

    validateSupabaseResponse(report, error)

    // Save worker details if provided
    if (workerDetails && workerDetails.length > 0 && report) {
      const workerInserts = workerDetails
        .filter(worker => worker.worker_name && worker.labor_hours > 0)
        .map(worker => ({
          daily_report_id: report.id,
          worker_name: worker.worker_name,
          work_hours: worker.labor_hours,
          created_at: new Date().toISOString()
        }))

      if (workerInserts.length > 0) {
        const { error: workerError } = await supabase
          .from('daily_report_workers')
          .insert(workerInserts)

        if (workerError) {
          console.error('Error saving worker details:', workerError)
          // Don't throw error here to avoid transaction rollback, just log
        }
      }
    }

    // Handle headquarters request if provided
    if (data.hq_request && data.hq_request.trim() && report) {
      await createHeadquartersRequest(supabase, user.id, data.site_id, data.hq_request, data.work_date)
    }

    revalidatePath('/dashboard/daily-reports')
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'createDailyReport')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '일일보고서 생성에 실패했습니다.' 
    }
  }
}

export async function updateDailyReport(
  id: string,
  data: Partial<DailyReport>
) {
  try {
    const supabase = await createClient()
    
    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    validateSupabaseResponse(report, error)

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'updateDailyReport')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '일일보고서 수정에 실패했습니다.' 
    }
  }
}

export async function submitDailyReport(id: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }
    
    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        status: 'submitted' as DailyReportStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single()

    if (error) {
      throw new AppError('보고서를 찾을 수 없거나 이미 제출되었습니다.', ErrorType.NOT_FOUND)
    }

    validateSupabaseResponse(report, error)

    // Send notification to site managers
    await notifyDailyReportSubmitted(report as unknown as DailyReport, user.id)

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'submitDailyReport')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '일일보고서 제출에 실패했습니다.' 
    }
  }
}

export async function approveDailyReport(
  id: string,
  approve: boolean,
  comments?: string
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        status: approve ? 'approved' : 'rejected' as DailyReportStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        notes: comments ? `${comments}\n\n---\nApproval comments` : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'submitted')
      .select()
      .single()

    if (error) {
      throw new AppError('보고서를 찾을 수 없거나 제출 상태가 아닙니다.', ErrorType.NOT_FOUND)
    }

    validateSupabaseResponse(report, error)

    // Send notification based on approval status
    if (approve) {
      await notifyDailyReportApproved(report as unknown as DailyReport, user.id)
    } else {
      await notifyDailyReportRejected(report as unknown as DailyReport, user.id, comments)
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'approveDailyReport')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '일일보고서 승인에 실패했습니다.' 
    }
  }
}

export async function getDailyReports(filters: {
  site_id?: string
  start_date?: string
  end_date?: string
  status?: DailyReportStatus
  limit?: number
  offset?: number
}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        site:sites(id, name)
      `)
      .order('work_date', { ascending: false })

    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters.start_date) {
      query = query.gte('work_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('work_date', filters.end_date)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      logError(error, 'getDailyReports')
      throw new AppError('일일보고서 목록을 불러오는데 실패했습니다.', ErrorType.SERVER_ERROR)
    }

    return { success: true, data, count }
  } catch (error) {
    logError(error, 'getDailyReports')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '일일보고서 목록을 불러오는데 실패했습니다.' 
    }
  }
}

export async function getDailyReportById(id: string) {
  try {
    const supabase = await createClient()
    
    // Get main report with site info
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        site:sites(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      logError(error, 'getDailyReportById')
      throw new AppError('일일보고서를 찾을 수 없습니다.', ErrorType.NOT_FOUND)
    }

    // Get creator profile if created_by exists
    let createdByProfile = null
    if (data.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.created_by)
        .single()
      createdByProfile = profile
    }

    // Get workers for this report
    const { data: workers } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', id)
      .order('worker_name')

    // Get documents (photos, receipts) for this report
    const { data: documents } = await supabase
      .from('daily_documents')
      .select('*')
      .eq('daily_report_id', id)
      .order('created_at')

    // Separate documents by type
    const beforePhotos = documents?.filter(doc => 
      doc.document_type === 'before_photo' || doc.category === 'before'
    ) || []
    
    const afterPhotos = documents?.filter(doc => 
      doc.document_type === 'after_photo' || doc.category === 'after'
    ) || []
    
    const receipts = documents?.filter(doc => 
      doc.document_type === 'receipt' || doc.file_type === 'receipt'
    ) || []

    // Combine all data
    const reportWithDetails = {
      ...data,
      workers: workers || [],
      beforePhotos,
      afterPhotos,
      receipts,
      documents: documents || [],
      createdByProfile
    }

    return { success: true, data: reportWithDetails }
  } catch (error) {
    logError(error, 'getDailyReportById')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '일일보고서를 불러오는데 실패했습니다.' 
    }
  }
}

// ==========================================
// WORK LOG ACTIONS
// ==========================================
// TODO: Implement when work_logs table is created

// export async function addWorkLog(
//   daily_report_id: string,
//   data: {
//     work_type: string
//     location: string
//     description: string
//     worker_count: number
//     notes?: string
//   }
// ) {
//   try {
//     const supabase = await createClient()
    
//     const { data: { user }, error: userError } = await supabase.auth.getUser()
//     if (userError || !user) {
//       return { success: false, error: 'User not authenticated' }
//     }

//     const { data: workLog, error } = await supabase
//       .from('work_logs')
//       .insert({
//         daily_report_id,
//         ...data,
//         created_by: user.id
//       })
//       .select()
//       .single()

//     if (error) {
//       console.error('Error adding work log:', error)
//       return { success: false, error: error.message }
//     }

//     revalidatePath(`/dashboard/daily-reports/${daily_report_id}`)
//     return { success: true, data: workLog }
//   } catch (error) {
//     console.error('Error in addWorkLog:', error)
//     return { success: false, error: 'Failed to add work log' }
//   }
// }

// export async function updateWorkLog(
//   id: string,
//   data: Partial<WorkLog>
// ) {
//   try {
//     const supabase = await createClient()
    
//     const { data: { user }, error: userError } = await supabase.auth.getUser()
//     if (userError || !user) {
//       return { success: false, error: 'User not authenticated' }
//     }

//     const { data: workLog, error } = await supabase
//       .from('work_logs')
//       .update({
//         ...data,
//         updated_by: user.id,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', id)
//       .select()
//       .single()

//     if (error) {
//       console.error('Error updating work log:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true, data: workLog }
//   } catch (error) {
//     console.error('Error in updateWorkLog:', error)
//     return { success: false, error: 'Failed to update work log' }
//   }
// }

// export async function deleteWorkLog(id: string) {
//   try {
//     const supabase = await createClient()
    
//     const { error } = await supabase
//       .from('work_logs')
//       .delete()
//       .eq('id', id)

//     if (error) {
//       console.error('Error deleting work log:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true }
//   } catch (error) {
//     console.error('Error in deleteWorkLog:', error)
//     return { success: false, error: 'Failed to delete work log' }
//   }
// }

// ==========================================
// WORK LOG MATERIALS ACTIONS
// ==========================================
// TODO: Implement when work_log_materials table is created

// export async function addWorkLogMaterials(
//   work_log_id: string,
//   materials: Array<{
//     material_id: string
//     quantity: number
//     notes?: string
//   }>
// ) {
//   try {
//     const supabase = await createClient()
    
//     const { data, error } = await supabase
//       .from('work_log_materials')
//       .insert(
//         materials.map(m => ({
//           work_log_id,
//           ...m
//         }))
//       )
//       .select()

//     if (error) {
//       console.error('Error adding work log materials:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true, data }
//   } catch (error) {
//     console.error('Error in addWorkLogMaterials:', error)
//     return { success: false, error: 'Failed to add work log materials' }
//   }
// }

// export async function updateWorkLogMaterial(
//   id: string,
//   data: {
//     quantity?: number
//     notes?: string
//   }
// ) {
//   try {
//     const supabase = await createClient()
    
//     const { data: material, error } = await supabase
//       .from('work_log_materials')
//       .update({
//         ...data,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', id)
//       .select()
//       .single()

//     if (error) {
//       console.error('Error updating work log material:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true, data: material }
//   } catch (error) {
//     console.error('Error in updateWorkLogMaterial:', error)
//     return { success: false, error: 'Failed to update work log material' }
//   }
// }

// export async function deleteWorkLogMaterial(id: string) {
//   try {
//     const supabase = await createClient()
    
//     const { error } = await supabase
//       .from('work_log_materials')
//       .delete()
//       .eq('id', id)

//     if (error) {
//       console.error('Error deleting work log material:', error)
//       return { success: false, error: error.message }
//     }

//     return { success: true }
//   } catch (error) {
//     console.error('Error in deleteWorkLogMaterial:', error)
//     return { success: false, error: 'Failed to delete work log material' }
//   }
// }

// ==========================================
// ADDITIONAL PHOTOS ACTIONS
// ==========================================

/**
 * 작업일지 추가 사진 업로드
 */
export async function uploadAdditionalPhotos(
  reportId: string,
  photos: { file: File; type: 'before' | 'after'; description?: string }[]
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    // Verify daily report exists and user has permission
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .select('id, created_by')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new AppError('작업일지를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
    }

    const uploadResults: AdditionalPhotoData[] = []
    const errors: string[] = []

    for (const photoData of photos) {
      try {
        // Get current count for upload order
        const { data: existingPhotos } = await supabase
          .from('daily_report_additional_photos')
          .select('upload_order')
          .eq('daily_report_id', reportId)
          .eq('photo_type', photoData.type)
          .order('upload_order', { ascending: false })
          .limit(1)

        const nextOrder = existingPhotos && existingPhotos.length > 0 
          ? existingPhotos[0].upload_order + 1 
          : 1

        // Check file size limit (10MB)
        if (photoData.file.size > 10 * 1024 * 1024) {
          errors.push(`${photoData.file.name}: 파일 크기가 10MB를 초과합니다.`)
          continue
        }

        // Generate unique filename
        const fileExt = photoData.file.name.split('.').pop()
        const fileName = `${reportId}_${photoData.type}_${nextOrder}_${Date.now()}.${fileExt}`
        const filePath = `daily-reports/${reportId}/additional/${photoData.type}/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('daily-reports')
          .upload(filePath, photoData.file, {
            upsert: false,
            contentType: photoData.file.type
          })

        if (uploadError) {
          errors.push(`${photoData.file.name}: 업로드 실패 - ${uploadError.message}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('daily-reports')
          .getPublicUrl(uploadData.path)

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('daily_report_additional_photos')
          .insert({
            daily_report_id: reportId,
            photo_type: photoData.type,
            file_url: publicUrl,
            file_path: uploadData.path,
            file_name: photoData.file.name,
            file_size: photoData.file.size,
            description: photoData.description || '',
            upload_order: nextOrder,
            uploaded_by: user.id
          })
          .select()
          .single()

        if (dbError) {
          // If database insert fails, clean up storage
          await supabase.storage
            .from('daily-reports')
            .remove([uploadData.path])
          
          errors.push(`${photoData.file.name}: 데이터베이스 저장 실패 - ${dbError.message}`)
          continue
        }

        uploadResults.push({
          id: dbData.id,
          filename: dbData.file_name,
          url: dbData.file_url,
          path: dbData.file_path,
          photo_type: dbData.photo_type as 'before' | 'after',
          file_size: dbData.file_size,
          description: dbData.description,
          upload_order: dbData.upload_order,
          uploaded_by: dbData.uploaded_by,
          uploaded_at: dbData.created_at
        })

      } catch (photoError) {
        logError(photoError, 'uploadAdditionalPhotos - individual photo')
        errors.push(`${photoData.file.name}: 처리 중 오류 발생`)
      }
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${reportId}`)

    return { 
      success: true, 
      data: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    logError(error, 'uploadAdditionalPhotos')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '사진 업로드에 실패했습니다.' 
    }
  }
}

/**
 * 작업일지 추가 사진 삭제
 */
export async function deleteAdditionalPhoto(photoId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    // Get photo data
    const { data: photo, error: photoError } = await supabase
      .from('daily_report_additional_photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      throw new AppError('사진을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
    }

    // Check permission - user must be owner or admin/manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = photo.uploaded_by === user.id
    const isManager = profile?.role && ['admin', 'system_admin', 'site_manager'].includes(profile.role)

    if (!isOwner && !isManager) {
      throw new AppError('사진을 삭제할 권한이 없습니다.', ErrorType.FORBIDDEN, 403)
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('daily-reports')
      .remove([photo.file_path])

    if (storageError) {
      console.warn('Storage deletion failed:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('daily_report_additional_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      throw new AppError('사진 삭제에 실패했습니다.', ErrorType.DATABASE, 500)
    }

    // Reorder remaining photos
    const { data: remainingPhotos, error: fetchError } = await supabase
      .from('daily_report_additional_photos')
      .select('id, upload_order')
      .eq('daily_report_id', photo.daily_report_id)
      .eq('photo_type', photo.photo_type)
      .order('upload_order', { ascending: true })

    if (!fetchError && remainingPhotos) {
      for (let i = 0; i < remainingPhotos.length; i++) {
        const newOrder = i + 1
        if (remainingPhotos[i].upload_order !== newOrder) {
          await supabase
            .from('daily_report_additional_photos')
            .update({ upload_order: newOrder })
            .eq('id', remainingPhotos[i].id)
        }
      }
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${photo.daily_report_id}`)

    return { success: true }
  } catch (error) {
    logError(error, 'deleteAdditionalPhoto')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '사진 삭제에 실패했습니다.' 
    }
  }
}

/**
 * 작업일지의 추가 사진 목록 조회
 */
export async function getAdditionalPhotos(reportId: string) {
  try {
    const supabase = await createClient()
    
    const { data: photos, error } = await supabase
      .from('daily_report_additional_photos')
      .select(`
        id,
        photo_type,
        file_url,
        file_path,
        file_name,
        file_size,
        description,
        upload_order,
        uploaded_by,
        created_at,
        profiles:uploaded_by(full_name)
      `)
      .eq('daily_report_id', reportId)
      .order('photo_type', { ascending: true })
      .order('upload_order', { ascending: true })

    if (error) {
      throw new AppError('사진 목록 조회에 실패했습니다.', ErrorType.DATABASE, 500)
    }

    const beforePhotos: AdditionalPhotoData[] = []
    const afterPhotos: AdditionalPhotoData[] = []

    photos?.forEach(photo => {
      const photoData: AdditionalPhotoData = {
        id: photo.id,
        filename: photo.file_name,
        url: photo.file_url,
        path: photo.file_path,
        photo_type: photo.photo_type as 'before' | 'after',
        file_size: photo.file_size,
        description: photo.description || '',
        upload_order: photo.upload_order,
        uploaded_by: photo.uploaded_by,
        uploaded_at: photo.created_at
      }

      if (photo.photo_type === 'before') {
        beforePhotos.push(photoData)
      } else {
        afterPhotos.push(photoData)
      }
    })

    return { 
      success: true, 
      data: {
        before: beforePhotos,
        after: afterPhotos
      }
    }
  } catch (error) {
    logError(error, 'getAdditionalPhotos')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '사진 목록 조회에 실패했습니다.' 
    }
  }
}