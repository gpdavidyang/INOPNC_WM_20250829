/**
 * notifications 관련 테이블 타입 정의
 */

import { UUID, Timestamps, Json } from '../index'

// notifications 테이블
export interface NotificationsTable extends Timestamps {
  id: UUID
  user_id: UUID
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success' | 'reminder'
  category?: string | null
  is_read: boolean
  read_at?: string | null
  action_url?: string | null
  action_type?: string | null
  expires_at?: string | null
  metadata?: Json | null
}

// notification_preferences 테이블
export interface NotificationPreferencesTable extends Timestamps {
  id: UUID
  user_id: UUID
  channel: 'email' | 'sms' | 'push' | 'in_app'
  category: string
  is_enabled: boolean
  frequency?: string | null
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  metadata?: Json | null
}

// notification_templates 테이블
export interface NotificationTemplatesTable extends Timestamps {
  id: UUID
  name: string
  category: string
  channel: 'email' | 'sms' | 'push' | 'in_app'
  subject?: string | null
  body_template: string
  variables?: Json | null
  is_active: boolean
  metadata?: Json | null
}