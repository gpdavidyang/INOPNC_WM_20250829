import { createClient } from '@/lib/supabase/server'
import { AppError, ErrorType, logError } from '@/lib/error-handling'
import type { DailyReport } from '@/types'

// 일일보고서 제출 시 알림 생성
export async function notifyDailyReportSubmitted(report: DailyReport, submitterId: string) {
  try {
    const supabase = createClient()
    
    // 현장 관리자들에게 알림 전송
    const { data: siteManagers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'site_manager')
      .contains('site_ids', [report.site_id])

    if (siteManagers && siteManagers.length > 0) {
      const notifications = siteManagers.map((manager: any) => ({
        user_id: manager.id,
        type: 'info',
        title: '새로운 작업일지 제출됨',
        message: `${report.member_name} 부재의 작업일지가 제출되었습니다.`,
        data: {
          report_id: report.id,
          site_id: report.site_id,
          work_date: report.work_date
        },
        action_url: `/dashboard/daily-reports/${report.id}`
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        logError(error, 'notifyDailyReportSubmitted')
      }
    }
  } catch (error) {
    logError(error, 'notifyDailyReportSubmitted')
  }
}

// 일일보고서 승인 시 알림 생성
export async function notifyDailyReportApproved(report: DailyReport, approverId: string) {
  try {
    const supabase = createClient()
    
    // 작성자에게 알림 전송
    const notification = {
      user_id: report.created_by,
      type: 'success' as const,
      title: '작업일지가 승인되었습니다',
      message: `${report.work_date} 작업일지가 승인되었습니다.`,
      data: {
        report_id: report.id,
        site_id: report.site_id,
        work_date: report.work_date,
        approved_by: approverId
      },
      action_url: `/dashboard/daily-reports/${report.id}`
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notification)

    if (error) {
      logError(error, 'notifyDailyReportApproved')
    }
  } catch (error) {
    logError(error, 'notifyDailyReportApproved')
  }
}

// 일일보고서 반려 시 알림 생성
export async function notifyDailyReportRejected(
  report: DailyReport, 
  rejectedBy: string, 
  reason?: string
) {
  try {
    const supabase = createClient()
    
    // 작성자에게 알림 전송
    const notification = {
      user_id: report.created_by,
      type: 'warning' as const,
      title: '작업일지가 반려되었습니다',
      message: reason 
        ? `${report.work_date} 작업일지가 반려되었습니다. 사유: ${reason}`
        : `${report.work_date} 작업일지가 반려되었습니다.`,
      data: {
        report_id: report.id,
        site_id: report.site_id,
        work_date: report.work_date,
        rejected_by: rejectedBy,
        reason
      },
      action_url: `/dashboard/daily-reports/${report.id}/edit`
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notification)

    if (error) {
      logError(error, 'notifyDailyReportRejected')
    }
  } catch (error) {
    logError(error, 'notifyDailyReportRejected')
  }
}

// NPC-1000 재고 부족 알림
export async function notifyLowNPC1000Stock(
  siteId: string, 
  currentStock: number, 
  threshold: number = 1000
) {
  try {
    const supabase = createClient()
    
    // 현장 관리자들에게 알림 전송
    const { data: siteManagers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'site_manager')
      .contains('site_ids', [siteId])

    if (siteManagers && siteManagers.length > 0) {
      const notifications = siteManagers.map((manager: any) => ({
        user_id: manager.id,
        type: 'warning' as const,
        title: 'NPC-1000 재고 부족',
        message: `현재 재고가 ${currentStock}kg으로 최소 재고량(${threshold}kg) 이하입니다.`,
        data: {
          site_id: siteId,
          current_stock: currentStock,
          threshold
        },
        action_url: `/dashboard/materials/npc1000`
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        logError(error, 'notifyLowNPC1000Stock')
      }
    }
  } catch (error) {
    logError(error, 'notifyLowNPC1000Stock')
  }
}

// 시스템 공지사항 알림
export async function notifySystemAnnouncement(
  title: string,
  message: string,
  targetRoles?: string[]
) {
  try {
    const supabase = createClient()
    
    // 대상 사용자 조회
    let query = supabase.from('profiles').select('id')
    
    if (targetRoles && targetRoles.length > 0) {
      query = query.in('role', targetRoles)
    }

    const { data: users } = await query

    if (users && users.length > 0) {
      const notifications = users.map((user: any) => ({
        user_id: user.id,
        type: 'system' as const,
        title,
        message,
        data: {
          announcement: true,
          target_roles: targetRoles
        }
      }))

      // 배치로 삽입 (최대 100개씩)
      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('notifications')
          .insert(batch)

        if (error) {
          logError(error, 'notifySystemAnnouncement')
        }
      }
    }
  } catch (error) {
    logError(error, 'notifySystemAnnouncement')
  }
}

// 작업자 출근 체크 알림
export async function notifyWorkerCheckIn(
  workerId: string,
  workerName: string,
  siteId: string,
  checkInTime: string
) {
  try {
    const supabase = createClient()
    
    // 현장 관리자에게 알림 전송
    const { data: siteManagers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'site_manager')
      .contains('site_ids', [siteId])

    if (siteManagers && siteManagers.length > 0) {
      const notifications = siteManagers.map((manager: any) => ({
        user_id: manager.id,
        type: 'info' as const,
        title: '작업자 출근',
        message: `${workerName}님이 ${checkInTime}에 출근했습니다.`,
        data: {
          worker_id: workerId,
          site_id: siteId,
          check_in_time: checkInTime
        },
        action_url: `/dashboard/attendance`
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        logError(error, 'notifyWorkerCheckIn')
      }
    }
  } catch (error) {
    logError(error, 'notifyWorkerCheckIn')
  }
}