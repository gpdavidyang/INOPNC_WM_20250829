/**
 * audit_logs 테이블 타입 정의
 */

import { UUID, Timestamps, Json } from '../index'

// audit_logs 테이블
export interface AuditLogsTable extends Timestamps {
  id: UUID
  user_id?: UUID | null
  action: string
  entity_type: string
  entity_id?: UUID | null
  old_values?: Json | null
  new_values?: Json | null
  ip_address?: string | null
  user_agent?: string | null
  session_id?: string | null
  metadata?: Json | null
}

// system_logs 테이블
export interface SystemLogsTable extends Timestamps {
  id: UUID
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  source: string
  message: string
  error_code?: string | null
  stack_trace?: string | null
  user_id?: UUID | null
  request_id?: string | null
  metadata?: Json | null
}

// activity_logs 테이블
export interface ActivityLogsTable extends Timestamps {
  id: UUID
  user_id: UUID
  activity_type: string
  description: string
  entity_type?: string | null
  entity_id?: UUID | null
  site_id?: UUID | null
  metadata?: Json | null
}