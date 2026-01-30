import { logError } from '@/lib/error-handling'
import { createClient } from '@/lib/supabase/server'
import type { DailyReport } from '@/types'

import { sendPushToUsers } from '@/lib/notifications/server-push'

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
          work_date: report.work_date,
        },
        action_url: `/dashboard/daily-reports/${report.id}`,
      }))

      // 1. DB Insert
      const { error } = await supabase.from('notifications').insert(notifications)
      if (error) {
        logError(error, 'notifyDailyReportSubmitted')
      }

      // 2. Push Notification
      const managerIds = siteManagers.map((m: any) => m.id)
      await sendPushToUsers({
        userIds: managerIds,
        notificationType: 'daily_report_submission',
        senderId: submitterId,
        payload: {
          title: '새로운 작업일지 제출',
          body: `${report.member_name} 부재의 작업일지가 제출되었습니다.`,
          data: { reportId: report.id, type: 'daily_report_submitted' },
          url: `/dashboard/daily-reports/${report.id}`,
          icon: '/icons/daily-report-icon.png',
        } as any,
      })
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
        approved_by: approverId,
      },
      action_url: `/dashboard/daily-reports/${report.id}`,
    }

    // 1. DB Insert
    const { error } = await supabase.from('notifications').insert(notification)
    if (error) {
      logError(error, 'notifyDailyReportApproved')
    }

    // 2. Push Notification
    if (report.created_by) {
      await sendPushToUsers({
        userIds: [report.created_by],
        notificationType: 'daily_report_approval',
        senderId: approverId,
        payload: {
          title: '작업일지 승인 완료',
          body: `${report.work_date} 작업일지가 승인되었습니다.`,
          data: { reportId: report.id, type: 'daily_report_approved' },
          url: `/dashboard/daily-reports/${report.id}`,
          icon: '/icons/approve-icon.png',
        } as any,
      })
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
        reason,
      },
      action_url: `/dashboard/daily-reports/${report.id}/edit`,
    }

    // 1. DB Insert
    const { error } = await supabase.from('notifications').insert(notification)
    if (error) {
      logError(error, 'notifyDailyReportRejected')
    }

    // 2. Push Notification
    if (report.created_by) {
      await sendPushToUsers({
        userIds: [report.created_by],
        notificationType: 'daily_report_rejection',
        senderId: rejectedBy,
        payload: {
          title: '작업일지 반려',
          body: reason ? `반려 사유: ${reason}` : `${report.work_date} 작업일지가 반려되었습니다.`,
          data: { reportId: report.id, type: 'daily_report_rejected' },
          url: `/dashboard/daily-reports/${report.id}/edit`,
          urgency: 'high',
          icon: '/icons/reject-icon.png',
        } as any,
      })
    }
  } catch (error) {
    logError(error, 'notifyDailyReportRejected')
  }
}

export async function notifyLowMaterialStock(
  siteId: string,
  materialLabel: string,
  currentStock: number,
  threshold: number = 0,
  unit?: string | null
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
      const unitSuffix = unit ? ` ${unit}` : ''
      const notifications = siteManagers.map((manager: unknown) => ({
        user_id: manager.id,
        type: 'warning' as const,
        title: `${materialLabel} 재고 부족`,
        message:
          threshold > 0
            ? `현재 재고가 ${currentStock}${unitSuffix}로 최소 재고량(${threshold}${unitSuffix}) 이하입니다.`
            : `현재 재고가 ${currentStock}${unitSuffix}로 설정된 임계값을 하회했습니다.`,
        data: {
          site_id: siteId,
          current_stock: currentStock,
          threshold,
          material: materialLabel,
          unit,
        },
        action_url: `/dashboard/admin/materials?tab=inventory&search=${encodeURIComponent(materialLabel)}`,
      }))

      const { error } = await supabase.from('notifications').insert(notifications)

      if (error) {
        logError(error, 'notifyLowMaterialStock')
      }
    }
  } catch (error) {
    logError(error, 'notifyLowMaterialStock')
  }
}

// Backward compatibility wrapper for legacy NPC notifications
export async function notifyLowNPC1000Stock(
  siteId: string,
  currentStock: number,
  threshold: number = 1000
) {
  return notifyLowMaterialStock(siteId, 'NPC-1000', currentStock, threshold)
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
      const notifications = users.map((user: unknown) => ({
        user_id: user.id,
        type: 'system' as const,
        title,
        message,
        data: {
          announcement: true,
          target_roles: targetRoles,
        },
      }))

      // 배치로 삽입 (최대 100개씩)
      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)

        const { error } = await supabase.from('notifications').insert(batch)

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
      const notifications = siteManagers.map((manager: unknown) => ({
        user_id: manager.id,
        type: 'info' as const,
        title: '작업자 출근',
        message: `${workerName}님이 ${checkInTime}에 출근했습니다.`,
        data: {
          worker_id: workerId,
          site_id: siteId,
          check_in_time: checkInTime,
        },
        action_url: `/dashboard/attendance`,
      }))

      const { error } = await supabase.from('notifications').insert(notifications)

      if (error) {
        logError(error, 'notifyWorkerCheckIn')
      }
    }
  } catch (error) {
    logError(error, 'notifyWorkerCheckIn')
  }
}
