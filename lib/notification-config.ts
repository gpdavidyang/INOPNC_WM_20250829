// Notification System Configuration
// 푸시 알림 시스템 설정 및 타입 정의

export interface NotificationConfig {
  type: string
  title: string
  body: string
  icon: string
  badge: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  vibrate?: number[]
  requireInteraction?: boolean
  silent?: boolean
  actions?: NotificationAction[]
  ttl: number // Time to live in seconds
  group?: string
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// Predefined notification configurations
export const NOTIFICATION_CONFIGS: Record<string, NotificationConfig> = {
  material_approval: {
    type: 'material_approval',
    title: '자재 요청 승인 필요',
    body: '{{material_name}} 자재 요청이 승인을 기다리고 있습니다',
    icon: '/icons/material-approval-icon.png',
    badge: '/icons/badge-material.png',
    urgency: 'high',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'approve', title: '승인', icon: '/icons/approve-icon.png' },
      { action: 'reject', title: '거부', icon: '/icons/reject-icon.png' },
      { action: 'view', title: '상세보기' }
    ],
    ttl: 86400, // 24 hours
    group: 'approvals'
  },

  daily_report_reminder: {
    type: 'daily_report_reminder',
    title: '작업일지 작성 리마인더',
    body: '오늘의 작업일지를 작성해주세요',
    icon: '/icons/daily-report-icon.png',
    badge: '/icons/badge-report.png',
    urgency: 'medium',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'create', title: '작성하기' },
      { action: 'remind_later', title: '나중에' }
    ],
    ttl: 3600, // 1 hour
    group: 'reminders'
  },

  safety_alert: {
    type: 'safety_alert',
    title: '⚠️ 안전 경고',
    body: '{{message}}',
    icon: '/icons/safety-alert-icon.png',
    badge: '/icons/badge-safety.png',
    urgency: 'critical',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    silent: false,
    actions: [
      { action: 'acknowledge', title: '확인', icon: '/icons/check-icon.png' },
      { action: 'view', title: '상세보기' },
      { action: 'emergency', title: '긴급신고', icon: '/icons/emergency-icon.png' }
    ],
    ttl: 86400, // 24 hours
    group: 'safety'
  },

  equipment_maintenance: {
    type: 'equipment_maintenance',
    title: '장비 정비 알림',
    body: '{{equipment_name}} 정비 시간입니다',
    icon: '/icons/equipment-maintenance-icon.png',
    badge: '/icons/badge-maintenance.png',
    urgency: 'medium',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'start_maintenance', title: '정비 시작' },
      { action: 'defer', title: '연기' },
      { action: 'view', title: '상세보기' }
    ],
    ttl: 7200, // 2 hours
    group: 'maintenance'
  },

  site_announcement: {
    type: 'site_announcement',
    title: '📢 {{title}}',
    body: '{{message}}',
    icon: '/icons/announcement-icon.png',
    badge: '/icons/badge-announcement.png',
    urgency: 'low',
    vibrate: [100],
    requireInteraction: false,
    actions: [
      { action: 'view', title: '상세보기' },
      { action: 'dismiss', title: '확인' }
    ],
    ttl: 3600, // 1 hour
    group: 'announcements'
  },

  // Additional notification types
  worker_assignment: {
    type: 'worker_assignment',
    title: '작업 배정 알림',
    body: '{{site_name}} 현장에 새로운 작업이 배정되었습니다',
    icon: '/icons/worker-assignment-icon.png',
    badge: '/icons/badge-assignment.png',
    urgency: 'medium',
    vibrate: [150, 75, 150],
    requireInteraction: false,
    actions: [
      { action: 'accept', title: '수락' },
      { action: 'view', title: '상세보기' }
    ],
    ttl: 7200, // 2 hours
    group: 'assignments'
  },

  attendance_reminder: {
    type: 'attendance_reminder',
    title: '출근 체크 리마인더',
    body: '출근 체크를 잊지 마세요',
    icon: '/icons/attendance-icon.png',
    badge: '/icons/badge-attendance.png',
    urgency: 'medium',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'check_in', title: '출근 체크' },
      { action: 'dismiss', title: '확인' }
    ],
    ttl: 1800, // 30 minutes
    group: 'reminders'
  },

  document_approval: {
    type: 'document_approval',
    title: '문서 승인 요청',
    body: '{{document_name}} 문서 승인이 필요합니다',
    icon: '/icons/document-approval-icon.png',
    badge: '/icons/badge-document.png',
    urgency: 'high',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'approve', title: '승인' },
      { action: 'reject', title: '반려' },
      { action: 'view', title: '상세보기' }
    ],
    ttl: 86400, // 24 hours
    group: 'approvals'
  },

  quality_inspection: {
    type: 'quality_inspection',
    title: '품질 검사 알림',
    body: '{{inspection_area}} 품질 검사가 예정되어 있습니다',
    icon: '/icons/quality-inspection-icon.png',
    badge: '/icons/badge-quality.png',
    urgency: 'medium',
    vibrate: [150, 75, 150],
    requireInteraction: false,
    actions: [
      { action: 'start_inspection', title: '검사 시작' },
      { action: 'schedule', title: '일정 조정' },
      { action: 'view', title: '상세보기' }
    ],
    ttl: 3600, // 1 hour
    group: 'inspections'
  },

  weather_warning: {
    type: 'weather_warning',
    title: '날씨 경보',
    body: '{{warning_type}} 경보가 발령되었습니다. 안전에 주의하세요.',
    icon: '/icons/weather-warning-icon.png',
    badge: '/icons/badge-weather.png',
    urgency: 'high',
    vibrate: [250, 100, 250, 100, 250],
    requireInteraction: true,
    actions: [
      { action: 'acknowledge', title: '확인' },
      { action: 'safety_measures', title: '안전조치' },
      { action: 'view', title: '상세보기' }
    ],
    ttl: 10800, // 3 hours
    group: 'safety'
  }
}

// Notification priority and grouping settings
export const NOTIFICATION_PRIORITIES = {
  critical: {
    weight: 100,
    persistent: true,
    bypassQuietHours: true,
    maxRetries: 3,
    retryInterval: 300 // 5 minutes
  },
  high: {
    weight: 75,
    persistent: true,
    bypassQuietHours: false,
    maxRetries: 2,
    retryInterval: 600 // 10 minutes
  },
  medium: {
    weight: 50,
    persistent: false,
    bypassQuietHours: false,
    maxRetries: 1,
    retryInterval: 1800 // 30 minutes
  },
  low: {
    weight: 25,
    persistent: false,
    bypassQuietHours: false,
    maxRetries: 0,
    retryInterval: 0
  }
}

// Notification grouping configuration
export const NOTIFICATION_GROUPS = {
  safety: {
    name: '안전 관련',
    priority: 'critical',
    maxGroupSize: 3,
    collapseAfter: 2
  },
  approvals: {
    name: '승인 요청',
    priority: 'high',
    maxGroupSize: 5,
    collapseAfter: 3
  },
  reminders: {
    name: '리마인더',
    priority: 'medium',
    maxGroupSize: 10,
    collapseAfter: 5
  },
  announcements: {
    name: '공지사항',
    priority: 'low',
    maxGroupSize: 15,
    collapseAfter: 10
  },
  maintenance: {
    name: '정비 관련',
    priority: 'medium',
    maxGroupSize: 5,
    collapseAfter: 3
  },
  assignments: {
    name: '작업 배정',
    priority: 'medium',
    maxGroupSize: 10,
    collapseAfter: 5
  },
  inspections: {
    name: '검사 관련',
    priority: 'medium',
    maxGroupSize: 5,
    collapseAfter: 3
  }
}

// Template variable replacement function
export function processNotificationTemplate(config: NotificationConfig, variables: Record<string, unknown>): NotificationConfig {
  const processed = { ...config }
  
  // Replace variables in title and body
  processed.title = replaceVariables(config.title, variables)
  processed.body = replaceVariables(config.body, variables)
  
  return processed
}

function replaceVariables(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match
  })
}

// Get notification configuration by type
export function getNotificationConfig(type: string): NotificationConfig | null {
  return NOTIFICATION_CONFIGS[type] || null
}

// Validate notification payload
export function validateNotificationPayload(payload: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!payload.title) {
    errors.push('Title is required')
  }
  
  if (!payload.body) {
    errors.push('Body is required')
  }
  
  if (payload.urgency && !['critical', 'high', 'medium', 'low'].includes(payload.urgency)) {
    errors.push('Invalid urgency level')
  }
  
  if (payload.actions && Array.isArray(payload.actions)) {
    payload.actions.forEach((action: unknown, index: number) => {
      if (!action.action) {
        errors.push(`Action ${index + 1} is missing action property`)
      }
      if (!action.title) {
        errors.push(`Action ${index + 1} is missing title property`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Get deep link URL for notification
export function getNotificationDeepLink(type: string, data?: unknown): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'
  
  switch (type) {
    case 'material_approval':
      return `${baseUrl}/dashboard/materials/requests${data?.requestId ? `/${data.requestId}` : ''}`
    case 'daily_report_reminder':
      return `${baseUrl}/dashboard/daily-reports/new`
    case 'safety_alert':
      return `${baseUrl}/dashboard/safety${data?.incidentId ? `/incidents/${data.incidentId}` : ''}`
    case 'equipment_maintenance':
      return `${baseUrl}/dashboard/equipment${data?.equipmentId ? `/${data.equipmentId}` : ''}`
    case 'site_announcement':
      return `${baseUrl}/dashboard/notifications${data?.announcementId ? `/${data.announcementId}` : ''}`
    case 'worker_assignment':
      return `${baseUrl}/dashboard/assignments${data?.assignmentId ? `/${data.assignmentId}` : ''}`
    case 'attendance_reminder':
      return `${baseUrl}/dashboard/attendance`
    case 'document_approval':
      return `${baseUrl}/dashboard/documents${data?.documentId ? `/${data.documentId}` : ''}`
    case 'quality_inspection':
      return `${baseUrl}/dashboard/quality${data?.inspectionId ? `/inspections/${data.inspectionId}` : ''}`
    case 'weather_warning':
      return `${baseUrl}/dashboard/weather${data?.warningId ? `/${data.warningId}` : ''}`
    default:
      return `${baseUrl}/dashboard/notifications`
  }
}

export default NOTIFICATION_CONFIGS