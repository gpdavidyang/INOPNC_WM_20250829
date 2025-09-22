export type BackupType = 'full' | 'incremental' | 'differential'
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type BackupTrigger = 'manual' | 'scheduled' | 'auto'

export interface BackupConfig {
  id: string
  name: string
  description?: string
  type: BackupType
  schedule?: string // Cron expression
  enabled: boolean
  retention_days: number
  include_files: boolean
  include_database: boolean
  compression: boolean
  encryption: boolean
  created_at: string
  updated_at: string
}

export interface BackupJob {
  id: string
  config_id: string
  type: BackupType
  trigger: BackupTrigger
  status: BackupStatus
  progress: number // 0-100
  started_at: string
  completed_at?: string
  file_path?: string
  file_size?: number // bytes
  compressed_size?: number // bytes
  error_message?: string
  metadata?: Record<string, unknown>
}

export interface BackupStats {
  total_backups: number
  successful_backups: number
  failed_backups: number
  total_size: number // bytes
  compressed_size: number // bytes
  latest_backup?: BackupJob
  oldest_backup?: BackupJob
  average_duration: number // seconds
}

export interface BackupRestoreRequest {
  backup_id: string
  target_database?: string
  include_files?: boolean
  overwrite_existing?: boolean
  restore_point?: string
}

export interface BackupRestoreJob {
  id: string
  backup_id: string
  status: BackupStatus
  progress: number // 0-100
  started_at: string
  completed_at?: string
  error_message?: string
  restored_items: string[]
}

export interface BackupMonitoring {
  id: string
  config_id: string
  alert_email?: string
  alert_webhook?: string
  failure_threshold: number // consecutive failures before alert
  size_threshold?: number // bytes - alert if backup size changes significantly
  duration_threshold?: number // seconds - alert if backup takes too long
  enabled: boolean
}

export interface BackupSchedule {
  id: string
  name: string
  cron_expression: string
  config_id: string
  enabled: boolean
  last_run?: string
  next_run?: string
  timezone: string
}

// Database backup specific types
export interface DatabaseBackupOptions {
  tables?: string[]
  exclude_tables?: string[]
  include_data: boolean
  include_schema: boolean
  format: 'sql' | 'csv' | 'json'
  compression: 'none' | 'gzip' | 'zip'
}

// File backup specific types
export interface FileBackupOptions {
  directories: string[]
  exclude_patterns?: string[]
  include_patterns?: string[]
  follow_symlinks: boolean
  compression: 'none' | 'gzip' | 'zip' | 'tar.gz'
  max_file_size?: number // bytes
}

export interface BackupLocation {
  type: 'local' | 's3' | 'gcs' | 'azure' | 'ftp'
  path: string
  credentials?: Record<string, string>
  bucket?: string // for cloud storage
  region?: string // for cloud storage
}

export interface BackupEncryption {
  enabled: boolean
  algorithm: 'aes-256-gcm' | 'aes-256-cbc'
  key_source: 'env' | 'kms' | 'vault'
  key_id?: string
}