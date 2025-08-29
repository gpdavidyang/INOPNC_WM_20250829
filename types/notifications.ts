// 알림 시스템 관련 타입 정의

// 알림 타입 (확장된 버전)
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval' | 'system'

// 관련 엔티티 타입
export type NotificationEntityType = 'daily_report' | 'material_request' | 'user' | 'site' | 'document'

// 알림 상태
export type NotificationStatus = 'sent' | 'failed' | 'pending'

// 알림 (확장된 버전)
export interface NotificationExtended {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  read_at?: string | null
  created_at: string
  created_by?: string | null
  related_entity_type?: NotificationEntityType | null
  related_entity_id?: string | null
  action_url?: string | null
}

// 알림 템플릿
export interface NotificationTemplate {
  id: string
  code: string
  name: string
  description?: string | null
  type: NotificationType
  title_template: string
  message_template: string
  variables?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// 사용자 알림 설정
export interface UserNotificationPreference {
  id: string
  user_id: string
  notification_type: string
  enabled: boolean
  email_enabled: boolean
  push_enabled: boolean
  created_at: string
  updated_at: string
}

// 알림 로그
export interface NotificationLog {
  id: string
  notification_id: string
  user_id: string
  status: NotificationStatus
  error_message?: string | null
  sent_at?: string | null
  created_at: string
}

// 알림 생성 요청 타입
export interface CreateNotificationRequest {
  user_id: string
  template_code: string
  variables?: Record<string, string>
  related_entity_type?: NotificationEntityType
  related_entity_id?: string
  action_url?: string
}

// 알림 필터 타입
export interface NotificationFilter {
  type?: NotificationType
  read?: boolean
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

// 알림 통계 타입
export interface NotificationStats {
  total: number
  unread: number
  by_type: Record<NotificationType, number>
}