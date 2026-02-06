'use server'

import {
  buildVariantStoragePaths,
  deriveVariantPathsFromStoredPath,
  generateImageVariants,
} from '@/lib/admin/site-photos'
import { assertOrgAccess, requireServerActionAuth, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType, logError, validateSupabaseResponse } from '@/lib/error-handling'
import {
  notifyDailyReportApproved,
  notifyDailyReportRejected,
  notifyDailyReportSubmitted,
} from '@/lib/notifications/triggers'
import { createClient } from '@/lib/supabase/server'
import type { DailyReport, DailyReportStatus } from '@/types'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function createHeadquartersRequest(
  supabase: unknown,
  requesterId: string,
  siteId: string,
  content: string,
  workDate: string
) {
  try {
    const { error } = await supabase.from('headquarters_requests').insert({
      requester_id: requesterId,
      site_id: siteId,
      category: 'general',
      subject: `${workDate} 작업일지 본사 요청사항`,
      content: content,
      urgency: 'medium',
      status: 'pending',
      request_date: workDate,
      created_at: new Date().toISOString(),
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

type SupabaseServerClient = SupabaseClient<Database>

async function ensureSiteAccess(supabase: SupabaseServerClient, auth: SimpleAuth, siteId?: string) {
  if (!siteId || !auth.isRestricted) {
    return
  }

  const { data: site, error } = await supabase
    .from('sites')
    .select('id, organization_id')
    .eq('id', siteId)
    .single()

  if (error || !site) {
    throw new AppError('현장 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  await assertOrgAccess(auth, site.organization_id ?? undefined)
}

async function fetchReportWithAccess(
  supabase: SupabaseServerClient,
  auth: SimpleAuth,
  reportId: string
) {
  const { data: report, error } = await supabase
    .from('daily_reports')
    .select(
      `
        id,
        site_id,
        created_by,
        status,
        site:sites(organization_id)
      `
    )
    .eq('id', reportId)
    .single()

  if (error || !report) {
    throw new AppError('일일보고서를 찾을 수 없습니다.', ErrorType.NOT_FOUND)
  }

  if (auth.isRestricted) {
    await assertOrgAccess(auth, report.site?.organization_id ?? undefined)
  }

  return report
}

// ==========================================
// DAILY REPORT ACTIONS
// ==========================================

export async function createDailyReport(
  data: {
    site_id: string
    partner_company_id?: string
    work_date: string
    member_name: string
    process_type: string // Required field in actual DB
    total_workers?: number
    npc1000_incoming?: number
    npc1000_used?: number
    npc1000_remaining?: number
    issues?: string
    hq_request?: string
  },
  workerDetails?: Array<{ worker_name: string; labor_hours: number; worker_id?: string }>
) {
  try {
    const supabase = createClient()

    const auth = await requireServerActionAuth(supabase)
    await ensureSiteAccess(supabase, auth, data.site_id)

    // Check if report already exists for this date and user
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id, status')
      .eq('site_id', data.site_id)
      .eq('work_date', data.work_date)
      .eq('created_by', auth.userId)
      .single()

    // If report exists, update it instead of creating new one
    if (existing) {
      const { data: report, error } = await supabase
        .from('daily_reports')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      validateSupabaseResponse(report, error)

      // Update worker details if provided
      if (workerDetails && report) {
        // Delete existing worker details
        await supabase.from('daily_report_workers').delete().eq('daily_report_id', report.id)

        // Insert new worker details
        if (workerDetails.length > 0) {
          const workerInserts = workerDetails
            .filter((worker: unknown) => worker.worker_name && worker.labor_hours > 0)
            .map((worker: unknown) => ({
              daily_report_id: report.id,
              worker_name: worker.worker_name,
              work_hours: worker.labor_hours,
              created_at: new Date().toISOString(),
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
        await createHeadquartersRequest(
          supabase,
          auth.userId,
          data.site_id,
          data.hq_request,
          data.work_date
        )
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
        created_by: auth.userId,
      })
      .select()
      .single()

    validateSupabaseResponse(report, error)

    // Save worker details if provided
    if (workerDetails && workerDetails.length > 0 && report) {
      const workerInserts = workerDetails
        .filter((worker: unknown) => worker.worker_name && worker.labor_hours > 0)
        .map((worker: unknown) => ({
          daily_report_id: report.id,
          worker_name: worker.worker_name,
          work_hours: worker.labor_hours,
          created_at: new Date().toISOString(),
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
      await createHeadquartersRequest(
        supabase,
        auth.userId,
        data.site_id,
        data.hq_request,
        data.work_date
      )
    }

    revalidatePath('/dashboard/daily-reports')
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'createDailyReport')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '일일보고서 생성에 실패했습니다.',
    }
  }
}

export async function updateDailyReport(id: string, data: Partial<DailyReport>) {
  try {
    const supabase = createClient()

    const auth = await requireServerActionAuth(supabase)
    const existingReport = await fetchReportWithAccess(supabase, auth, id)

    const isManager = auth.role
      ? ['admin', 'system_admin', 'site_manager'].includes(auth.role)
      : false

    if (auth.isRestricted && existingReport.created_by !== auth.userId) {
      throw new AppError('해당 작업일지를 수정할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    let updateQuery = supabase
      .from('daily_reports')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (auth.isRestricted && !isManager) {
      updateQuery = updateQuery.eq('created_by', auth.userId)
    }

    const { data: report, error } = await updateQuery.select().single()

    validateSupabaseResponse(report, error)

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'updateDailyReport')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '일일보고서 수정에 실패했습니다.',
    }
  }
}

export async function submitDailyReport(id: string) {
  try {
    const supabase = createClient()

    const auth = await requireServerActionAuth(supabase)
    const existingReport = await fetchReportWithAccess(supabase, auth, id)

    if (auth.isRestricted && existingReport.created_by !== auth.userId) {
      throw new AppError('해당 작업일지를 제출할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    let updateQuery = supabase
      .from('daily_reports')
      .update({
        status: 'submitted' as DailyReportStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'draft')

    if (auth.isRestricted) {
      updateQuery = updateQuery.eq('created_by', auth.userId)
    }

    const { data: report, error } = await updateQuery.select().single()

    if (error) {
      throw new AppError('보고서를 찾을 수 없거나 이미 제출되었습니다.', ErrorType.NOT_FOUND)
    }

    validateSupabaseResponse(report, error)

    // Aggregate additional photos into JSON arrays if columns are available
    try {
      const { data: rows } = await supabase
        .from('daily_report_additional_photos')
        .select('photo_type, file_url, description, upload_order')
        .eq('daily_report_id', id)
        .order('upload_order', { ascending: true })

      const before = [] as Array<{ url: string; description?: string; order: number }>
      const after = [] as Array<{ url: string; description?: string; order: number }>
      ;(rows || []).forEach((r: any) => {
        const item = {
          url: r.file_url,
          description: r.description || undefined,
          order: r.upload_order || 0,
        }
        if (r.photo_type === 'before') before.push(item)
        else if (r.photo_type === 'after') after.push(item)
      })

      // Try update; ignore if columns not present in this schema
      await supabase
        .from('daily_reports')
        .update({ additional_before_photos: before, additional_after_photos: after })
        .eq('id', id)
    } catch (e) {
      // ignore aggregation failure to not block submission
    }

    // Send notification to site managers
    await notifyDailyReportSubmitted(report as unknown as DailyReport, auth.userId)

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'submitDailyReport')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '일일보고서 제출에 실패했습니다.',
    }
  }
}

export async function approveDailyReport(id: string, approve: boolean, comments?: string) {
  try {
    const supabase = createClient()

    const auth = await requireServerActionAuth(supabase)
    await fetchReportWithAccess(supabase, auth, id)

    const { data: report, error } = await supabase
      .from('daily_reports')
      .update({
        status: approve ? 'approved' : ('rejected' as DailyReportStatus),
        approved_by: auth.userId,
        approved_at: new Date().toISOString(),
        notes: comments ? `${comments}\n\n---\nApproval comments` : undefined,
        updated_at: new Date().toISOString(),
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
      await notifyDailyReportApproved(report as unknown as DailyReport, auth.userId)
    } else {
      await notifyDailyReportRejected(report as unknown as DailyReport, auth.userId, comments)
    }

    revalidatePath('/dashboard/daily-reports')
    revalidatePath(`/dashboard/daily-reports/${id}`)
    return { success: true, data: report }
  } catch (error) {
    logError(error, 'approveDailyReport')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '일일보고서 승인에 실패했습니다.',
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
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (filters.site_id) {
      await ensureSiteAccess(supabase, auth, filters.site_id)
    }

    let query = supabase
      .from('daily_reports')
      .select(
        `
        *,
        site:sites(
          id,
          name,
          organization_id
        )
      `
      )
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

    if (auth.isRestricted) {
      if (auth.restrictedOrgId) {
        query = query.eq('site.organization_id', auth.restrictedOrgId)
      }
      query = query.eq('created_by', auth.userId)
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
      error:
        error instanceof AppError ? error.message : '일일보고서 목록을 불러오는데 실패했습니다.',
    }
  }
}

export async function getDailyReportById(id: string) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)
    const accessReport = await fetchReportWithAccess(supabase, auth, id)

    if (auth.isRestricted && accessReport.created_by !== auth.userId) {
      throw new AppError('해당 작업일지를 조회할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    // Get main report with site info and partner company
    const { data, error } = await supabase
      .from('daily_reports')
      .select(
        `
        *,
        site:sites(*),
        partner_company:partner_companies(*)
      `
      )
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

    // Get workers for this report from daily_report_workers
    const { data: workers } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', id)
      .order('worker_name')

    // Get worker assignments with profile details
    const { data: workerAssignments } = await supabase
      .from('work_records')
      .select(
        `
        *,
        profile:profiles(*)
      `
      )
      .eq('daily_report_id', id)
      .order('assigned_at')

    // Get documents (photos, receipts) for this report
    const { data: documents } = await supabase
      .from('daily_documents')
      .select('*')
      .eq('daily_report_id', id)
      .order('created_at')

    // Get photo groups
    const { data: photoGroups } = await supabase
      .from('photo_groups')
      .select('*')
      .eq('daily_report_id', id)
      .order('created_at')

    // Separate documents by type
    const beforePhotos =
      documents?.filter(
        (doc: unknown) => doc.document_type === 'before_photo' || doc.category === 'before'
      ) || []

    const afterPhotos =
      documents?.filter(
        (doc: unknown) => doc.document_type === 'after_photo' || doc.category === 'after'
      ) || []

    const receipts =
      documents?.filter(
        (doc: unknown) => doc.document_type === 'receipt' || doc.file_type === 'receipt'
      ) || []

    // Combine all data
    const reportWithDetails = {
      ...data,
      workers: workers || [],
      workerAssignments: workerAssignments || [],
      photoGroups: photoGroups || [],
      beforePhotos,
      afterPhotos,
      receipts,
      documents: documents || [],
      createdByProfile,
    }

    return { success: true, data: reportWithDetails }
  } catch (error) {
    logError(error, 'getDailyReportById')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '일일보고서를 불러오는데 실패했습니다.',
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
    const supabase = createClient()

    const auth = await requireServerActionAuth(supabase)
    const report = await fetchReportWithAccess(supabase, auth, reportId)

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

        const nextOrder =
          existingPhotos && existingPhotos.length > 0 ? existingPhotos[0].upload_order + 1 : 1

        // Check file size limit (10MB)
        if (photoData.file.size > 10 * 1024 * 1024) {
          errors.push(`${photoData.file.name}: 파일 크기가 10MB를 초과합니다.`)
          continue
        }

        const arrayBuffer = await photoData.file.arrayBuffer()
        // @ts-ignore Buffer available in node runtime
        const buffer = Buffer.from(arrayBuffer)
        const paths = buildVariantStoragePaths(reportId, photoData.type, photoData.file.name)
        const { displayBuffer, thumbBuffer } = await generateImageVariants(buffer)

        // Upload original
        const { error: origError } = await supabase.storage
          .from('daily-reports')
          .upload(paths.originalPath, buffer, {
            upsert: false,
            contentType: photoData.file.type,
          })
        if (origError) {
          errors.push(`${photoData.file.name}: 업로드 실패 - ${origError.message}`)
          continue
        }

        // Upload display
        const { error: displayError } = await supabase.storage
          .from('daily-reports')
          .upload(paths.displayPath, displayBuffer, {
            upsert: false,
            contentType: 'image/jpeg',
          })
        if (displayError) {
          // clean up original
          await supabase.storage.from('daily-reports').remove([paths.originalPath])
          errors.push(`${photoData.file.name}: 업로드 실패 - ${displayError.message}`)
          continue
        }

        // Upload thumb
        const { error: thumbError } = await supabase.storage
          .from('daily-reports')
          .upload(paths.thumbPath, thumbBuffer, {
            upsert: false,
            contentType: 'image/jpeg',
          })
        if (thumbError) {
          await supabase.storage
            .from('daily-reports')
            .remove([paths.originalPath, paths.displayPath])
          errors.push(`${photoData.file.name}: 업로드 실패 - ${thumbError.message}`)
          continue
        }

        const {
          data: { publicUrl: displayUrl },
        } = supabase.storage.from('daily-reports').getPublicUrl(paths.displayPath)
        const {
          data: { publicUrl: thumbUrl },
        } = supabase.storage.from('daily-reports').getPublicUrl(paths.thumbPath)

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('daily_report_additional_photos')
          .insert({
            daily_report_id: reportId,
            photo_type: photoData.type,
            file_url: displayUrl,
            file_path: paths.originalPath,
            file_name: photoData.file.name,
            file_size: photoData.file.size,
            description: photoData.description || '',
            upload_order: nextOrder,
            uploaded_by: auth.userId,
          })
          .select()
          .single()

        if (dbError) {
          // If database insert fails, clean up storage
          await supabase.storage
            .from('daily-reports')
            .remove([paths.originalPath, paths.displayPath, paths.thumbPath])

          errors.push(`${photoData.file.name}: 데이터베이스 저장 실패 - ${dbError.message}`)
          continue
        }

        uploadResults.push({
          id: dbData.id,
          filename: dbData.file_name,
          url: dbData.file_url,
          thumbnail_url: dbData.thumbnail_url ?? thumbUrl,
          display_url: dbData.display_url ?? displayUrl,
          path: dbData.file_path,
          storage_path: dbData.file_path,
          photo_type: dbData.photo_type as 'before' | 'after',
          file_size: dbData.file_size,
          description: dbData.description,
          upload_order: dbData.upload_order,
          uploaded_by: dbData.uploaded_by,
          uploaded_at: dbData.created_at,
          daily_report_id: reportId,
          site_id: report?.site_id,
          admin_uploaded: false,
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
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    logError(error, 'uploadAdditionalPhotos')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '사진 업로드에 실패했습니다.',
    }
  }
}

/**
 * 작업일지 추가 사진 삭제
 */
export async function deleteAdditionalPhoto(photoId: string) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    // Get photo data
    const { data: photo, error: photoError } = await supabase
      .from('daily_report_additional_photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      throw new AppError('사진을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
    }

    await fetchReportWithAccess(supabase, auth, photo.daily_report_id)

    // Check permission - user must be owner or admin/manager
    const isOwner = photo.uploaded_by === auth.userId
    const isManager = auth.role
      ? ['admin', 'system_admin', 'site_manager'].includes(auth.role)
      : false

    if (!isOwner && !isManager) {
      throw new AppError('사진을 삭제할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    // Delete from storage (all variants)
    const variants = deriveVariantPathsFromStoredPath(photo.file_path)
    const removeList = Array.from(
      new Set([photo.file_path, variants.originalPath, variants.displayPath, variants.thumbPath])
    )
    const { error: storageError } = await supabase.storage.from('daily-reports').remove(removeList)

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
      throw new AppError('사진 삭제에 실패했습니다.', ErrorType.SERVER_ERROR, 500)
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
      error: error instanceof AppError ? error.message : '사진 삭제에 실패했습니다.',
    }
  }
}

/**
 * 작업일지의 추가 사진 목록 조회
 */
export async function getAdditionalPhotos(reportId: string) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)
    const report = await fetchReportWithAccess(supabase, auth, reportId)

    if (auth.isRestricted && report.created_by !== auth.userId) {
      throw new AppError('사진을 조회할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    const { data: photos, error } = await supabase
      .from('daily_report_additional_photos')
      .select(
        `
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
        profiles:uploaded_by(full_name, role)
      `
      )
      .eq('daily_report_id', reportId)
      .order('photo_type', { ascending: true })
      .order('upload_order', { ascending: true })

    if (error) {
      throw new AppError('사진 목록 조회에 실패했습니다.', ErrorType.SERVER_ERROR, 500)
    }

    const beforePhotos: AdditionalPhotoData[] = []
    const afterPhotos: AdditionalPhotoData[] = []

    photos?.forEach((photo: unknown) => {
      const photoData: AdditionalPhotoData = {
        id: photo.id,
        filename: photo.file_name,
        url: photo.file_url,
        path: photo.file_path,
        storage_path: photo.file_path,
        photo_type: photo.photo_type as 'before' | 'after',
        file_size: photo.file_size,
        description: photo.description || '',
        upload_order: photo.upload_order,
        uploaded_by: photo.uploaded_by,
        uploaded_at: photo.created_at,
        uploaded_by_name: (photo as any)?.profiles?.full_name || undefined,
        admin_uploaded:
          ((photo as any)?.profiles?.role ?? '')
            ? ['admin', 'system_admin'].includes((photo as any).profiles.role)
            : undefined,
        daily_report_id: reportId,
        site_id: report?.site_id,
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
        after: afterPhotos,
      },
    }
  } catch (error) {
    logError(error, 'getAdditionalPhotos')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '사진 목록 조회에 실패했습니다.',
    }
  }
}

/**
 * 작업자 본인의 공수를 특정 날짜/현장에 직접 입력하여 제출
 */
/**
 * 작업자 본인의 공수를 특정 날짜/현장에 직접 입력/수정하여 제출
 * - 이미 승인된(approved) 작업일지는 수정 불가
 * - 이미 존재하는 내역이 있다면 업데이트, 없으면 생성
 */
export async function upsertMyLabor(data: { siteId: string; workDate: string; hours: number }) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    // 1. 프로필 정보 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.userId)
      .single()

    if (!profile) {
      throw new AppError('프로필 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND)
    }

    // 2. 해당 날짜/현장의 작업일지 존재 여부 확인
    let { data: report } = await supabase
      .from('daily_reports')
      .select('id, status')
      .eq('site_id', data.siteId)
      .eq('work_date', data.workDate)
      .maybeSingle()

    // 3. 승인된 작업일지인 경우 수정 불가
    if (report && report.status === 'approved') {
      throw new AppError('이미 승인된 작업일지는 수정할 수 없습니다.', ErrorType.FORBIDDEN)
    }

    // 4. 작업일지가 없으면 새로 생성 (기본 제출 상태)
    if (!report) {
      const { data: newReport, error: createError } = await supabase
        .from('daily_reports')
        .insert({
          site_id: data.siteId,
          work_date: data.workDate,
          status: 'submitted',
          member_name: profile.full_name,
          created_by: auth.userId,
          process_type: '일반작업',
        })
        .select('id, status')
        .single()

      if (createError) throw createError
      report = newReport
    }

    if (!report) throw new AppError('작업일지 생성에 실패했습니다.', ErrorType.UNKNOWN)

    // 5. 인력 투입 정보 확인 (본인 이름 기준)
    // 동명이인 이슈 방지를 위해 worker_name이 정확히 일치하는지 확인하거나,
    // 본인입력 마킹이 된 건을 찾음. 여기서는 간단히 이름 + 본인입력 마커 로직 유지 또는 추가

    // 기존 로직: 이름으로 찾기.
    // 개선: daily_report_workers에는 user_id 필드가 없으므로 이름 매칭 혹은 메타데이터 필요.
    // 현재 스키마 상 user_id 연결이 없으므로, 이름으로 검색하되 "(본인입력)" 접미사 처리를 유의.

    const targetName = `${profile.full_name} (본인입력)`

    // 5. 인력 투입 정보 (daily_report_workers) 업데이트
    const { data: existingWorker } = await supabase
      .from('daily_report_workers')
      .select('id')
      .eq('daily_report_id', report.id)
      .eq('worker_name', targetName)
      .maybeSingle()

    if (existingWorker) {
      const { error: updateError } = await supabase
        .from('daily_report_workers')
        .update({
          work_hours: data.hours,
          labor_hours: data.hours / 8,
          worker_id: auth.userId,
          man_days: data.hours / 8,
        })
        .eq('id', existingWorker.id)
      if (updateError) console.error('Error updating worker record:', updateError)
    } else {
      const { error: insertError } = await supabase.from('daily_report_workers').insert({
        daily_report_id: report.id,
        worker_name: targetName,
        worker_id: auth.userId,
        work_hours: data.hours,
        labor_hours: data.hours / 8,
        man_days: data.hours / 8,
      })
      if (insertError) console.error('Error inserting worker record:', insertError)
    }

    // 6. 근태 기록 (work_records) 동기화 - 캘린더 연동 핵심
    // 해당 날짜/현장에 이미 본인의 근태 기록이 있는지 확인
    const { data: existingWorkRecord } = await supabase
      .from('work_records')
      .select('id')
      .eq('profile_id', auth.userId)
      .eq('work_date', data.workDate)
      .eq('site_id', data.siteId)
      .maybeSingle()

    if (existingWorkRecord) {
      await supabase
        .from('work_records')
        .update({
          labor_hours: data.hours / 8,
          work_hours: data.hours,
          status: 'submitted',
          daily_report_id: report.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingWorkRecord.id)
    } else {
      await supabase.from('work_records').insert({
        profile_id: auth.userId,
        user_id: auth.userId,
        site_id: data.siteId,
        work_date: data.workDate,
        labor_hours: data.hours / 8,
        work_hours: data.hours,
        status: 'submitted',
        daily_report_id: report.id,
      })
    }

    revalidatePath('/mobile/attendance')

    return {
      success: true,
      message: '공수 정보가 저장되었습니다.',
    }
  } catch (error) {
    logError(error, 'upsertMyLabor')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '공수 제출에 실패했습니다.',
    }
  }
}

/**
 * 다수의 공수 정보를 일괄 저장 (Batch Upsert)
 */
export async function batchUpsertMyLabor(
  updates: Array<{ siteId: string; workDate: string; hours: number }>
) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    // 1. 프로필 정보 조회 (1회)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.userId)
      .single()

    if (!profile) {
      throw new AppError('프로필 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND)
    }

    const results = []

    // 순차 처리 (병렬 처리는 DB 락 이슈 가능성 있으므로 순차 권장)
    for (const data of updates) {
      try {
        // --- Single Upsert Logic (Reused) ---

        // 2. 해당 날짜/현장의 작업일지 존재 여부 확인
        let { data: report } = await supabase
          .from('daily_reports')
          .select('id, status')
          .eq('site_id', data.siteId)
          .eq('work_date', data.workDate)
          .maybeSingle()

        // 3. 승인된 작업일지인 경우 수정 불가 -> Skip (or Error?)
        // Batch 처리 시에는 실패한 건만 건너뛰거나 에러 리포팅. 여기서는 에러 발생 시 Catch로 이동
        if (report && report.status === 'approved') {
          throw new AppError(
            `[${data.siteId}] 이미 승인된 작업일지는 수정할 수 없습니다.`,
            ErrorType.FORBIDDEN
          )
        }

        // 4. 작업일지가 없으면 새로 생성 (기본 제출 상태)
        if (!report) {
          const { data: newReport, error: createError } = await supabase
            .from('daily_reports')
            .insert({
              site_id: data.siteId,
              work_date: data.workDate,
              status: 'submitted',
              member_name: profile.full_name,
              created_by: auth.userId,
              process_type: '일반작업',
            })
            .select('id, status')
            .single()

          if (createError) throw createError
          report = newReport
        }

        if (!report) throw new AppError('작업일지 생성에 실패했습니다.', ErrorType.UNKNOWN)

        const targetName = `${profile.full_name} (본인입력)`

        // 5. 인력 투입 정보 (daily_report_workers) 업데이트
        const { data: existingWorker } = await supabase
          .from('daily_report_workers')
          .select('id')
          .eq('daily_report_id', report.id)
          .eq('worker_name', targetName)
          .maybeSingle()

        if (existingWorker) {
          const { error: updateError } = await supabase
            .from('daily_report_workers')
            .update({
              work_hours: data.hours,
              labor_hours: data.hours / 8,
              worker_id: auth.userId,
              man_days: data.hours / 8,
            })
            .eq('id', existingWorker.id)
        } else {
          await supabase.from('daily_report_workers').insert({
            daily_report_id: report.id,
            worker_name: targetName,
            worker_id: auth.userId,
            work_hours: data.hours,
            labor_hours: data.hours / 8,
            man_days: data.hours / 8,
          })
        }

        // 6. 근태 기록 (work_records) 동기화
        const { data: existingWorkRecord } = await supabase
          .from('work_records')
          .select('id')
          .eq('profile_id', auth.userId)
          .eq('work_date', data.workDate)
          .eq('site_id', data.siteId)
          .maybeSingle()

        if (existingWorkRecord) {
          await supabase
            .from('work_records')
            .update({
              labor_hours: data.hours / 8,
              work_hours: data.hours,
              status: 'submitted',
              daily_report_id: report.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingWorkRecord.id)
        } else {
          await supabase.from('work_records').insert({
            profile_id: auth.userId,
            user_id: auth.userId,
            site_id: data.siteId,
            work_date: data.workDate,
            labor_hours: data.hours / 8,
            work_hours: data.hours,
            status: 'submitted',
            daily_report_id: report.id,
          })
        }

        results.push({ siteId: data.siteId, success: true })
      } catch (innerError) {
        console.error(`Error processing batch item for site ${data.siteId}:`, innerError)
        results.push({
          siteId: data.siteId,
          success: false,
          error: innerError instanceof Error ? innerError.message : 'Unknown error',
        })
      }
    }

    revalidatePath('/mobile/attendance')

    return {
      success: true,
      data: results,
      message: `${results.filter(r => r.success).length}건이 저장되었습니다.`,
    }
  } catch (error) {
    logError(error, 'batchUpsertMyLabor')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '일괄 저장에 실패했습니다.',
    }
  }
}
