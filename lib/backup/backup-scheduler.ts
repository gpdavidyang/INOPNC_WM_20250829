import { createClient } from '@/lib/supabase/server'
import { logError, AppError } from '@/lib/error-handling'
import { DatabaseBackupService } from './database-backup'
import { FileBackupService } from './file-backup'
import type { 
  BackupConfig, 
  BackupJob, 
  BackupSchedule, 
  BackupType,
  BackupLocation,
  DatabaseBackupOptions,
  FileBackupOptions
} from './types'
import { CronJob } from 'cron'

export class BackupScheduler {
  private supabase = createClient()
  private databaseBackup = new DatabaseBackupService()
  private fileBackup = new FileBackupService()
  private scheduledJobs = new Map<string, CronJob>()
  private runningJobs = new Set<string>()

  constructor() {
    this.initializeScheduler()
  }

  async initializeScheduler() {
    try {
      // Load existing schedules from database
      const { data: schedules, error } = await (this.supabase as any)
        .from('backup_schedules')
        .select(`
          *,
          backup_configs(*)
        `)
        .eq('enabled', true)

      if (error) {
        logError(error, 'initializeScheduler')
        return
      }

      // Create cron jobs for each schedule
      for (const schedule of schedules || []) {
        await this.createScheduledJob(schedule)
      }

      console.log(`✅ Backup scheduler initialized with ${schedules?.length || 0} scheduled jobs`)
    } catch (error) {
      logError(error, 'initializeScheduler')
    }
  }

  private async createScheduledJob(schedule: any) {
    try {
      const job = new CronJob(
        schedule.cron_expression,
        async () => {
          await this.executeScheduledBackup(schedule.config_id, schedule.id)
        },
        null,
        false, // Don't start automatically
        schedule.timezone || 'Asia/Seoul'
      )

      this.scheduledJobs.set(schedule.id, job)
      job.start()

      console.log(`📅 Scheduled backup job created: ${schedule.name} (${schedule.cron_expression})`)
    } catch (error) {
      logError(error, `createScheduledJob:${schedule.id}`)
    }
  }

  async executeScheduledBackup(configId: string, scheduleId?: string) {
    try {
      // Check if this config is already running
      if (this.runningJobs.has(configId)) {
        console.log(`⚠️ Backup ${configId} is already running, skipping...`)
        return
      }

      // Get backup configuration
      const { data: config, error: configError } = await (this.supabase as any)
        .from('backup_configs')
        .select('*')
        .eq('id', configId)
        .single()

      if (configError || !config) {
        logError(configError, `executeScheduledBackup:config:${configId}`)
        return
      }

      if (!config.enabled) {
        console.log(`⚠️ Backup config ${configId} is disabled, skipping...`)
        return
      }

      // Create backup job record
      const jobId = await this.createBackupJobRecord(config, 'scheduled')
      
      if (!jobId) {
        throw new AppError('Failed to create backup job record')
      }

      // Mark as running
      this.runningJobs.add(configId)

      try {
        // Execute backup based on type
        await this.executeBackup(jobId, config)

        // Update schedule last run time
        if (scheduleId) {
          await this.updateScheduleLastRun(scheduleId)
        }

        console.log(`✅ Scheduled backup completed: ${config.name}`)
      } finally {
        // Remove from running jobs
        this.runningJobs.delete(configId)
      }
    } catch (error) {
      logError(error, `executeScheduledBackup:${configId}`)
      this.runningJobs.delete(configId)
    }
  }

  async executeManualBackup(configId: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Check if this config is already running
      if (this.runningJobs.has(configId)) {
        return {
          success: false,
          error: '해당 백업이 이미 실행 중입니다.'
        }
      }

      // Get backup configuration
      const { data: config, error: configError } = await (this.supabase as any)
        .from('backup_configs')
        .select('*')
        .eq('id', configId)
        .single()

      if (configError || !config) {
        return {
          success: false,
          error: '백업 설정을 찾을 수 없습니다.'
        }
      }

      // Create backup job record
      const jobId = await this.createBackupJobRecord(config, 'manual')
      
      if (!jobId) {
        return {
          success: false,
          error: '백업 작업 생성에 실패했습니다.'
        }
      }

      // Mark as running
      this.runningJobs.add(configId)

      try {
        // Execute backup
        await this.executeBackup(jobId, config)
        
        return {
          success: true,
          jobId
        }
      } finally {
        // Remove from running jobs
        this.runningJobs.delete(configId)
      }
    } catch (error) {
      logError(error, `executeManualBackup:${configId}`)
      this.runningJobs.delete(configId)
      return {
        success: false,
        error: error instanceof AppError ? error.message : '백업 실행 중 오류가 발생했습니다.'
      }
    }
  }

  private async executeBackup(jobId: string, config: BackupConfig) {
    try {
      // Update job status to running
      await this.updateJobStatus(jobId, 'running', 0)

      const location: BackupLocation = {
        type: 'local',
        path: process.env.BACKUP_DIR || './backups'
      }

      let result: { success: boolean; filePath?: string; size?: number; error?: string }

      if (config.include_database && config.include_files) {
        // Combined backup
        result = await this.executeCombinadBackup(jobId, config, location)
      } else if (config.include_database) {
        // Database only backup
        result = await this.executeDatabaseBackup(jobId, config, location)
      } else if (config.include_files) {
        // Files only backup
        result = await this.executeFileBackup(jobId, config, location)
      } else {
        throw new AppError('백업 설정에 데이터베이스 또는 파일 백업이 활성화되어야 합니다.')
      }

      if (result.success) {
        // Update job as completed
        await this.updateJobStatus(jobId, 'completed', 100, {
          file_path: result.filePath,
          file_size: result.size
        })

        // Validate backup if file was created
        if (result.filePath) {
          await this.validateAndLogBackup(jobId, result.filePath, config)
        }

        // Clean up old backups based on retention policy
        await this.cleanupOldBackups(config)
      } else {
        // Update job as failed
        await this.updateJobStatus(jobId, 'failed', 0, {
          error_message: result.error
        })
      }
    } catch (error) {
      logError(error, `executeBackup:${jobId}`)
      await this.updateJobStatus(jobId, 'failed', 0, {
        error_message: error instanceof AppError ? error.message : '백업 실행 중 오류가 발생했습니다.'
      })
    }
  }

  private async executeDatabaseBackup(
    jobId: string, 
    config: BackupConfig, 
    location: BackupLocation
  ) {
    const options: DatabaseBackupOptions = {
      include_data: true,
      include_schema: true,
      format: 'sql',
      compression: config.compression ? 'gzip' : 'none'
    }

    const progressCallback = (progress: number) => {
      this.updateJobStatus(jobId, 'running', progress)
    }

    if (config.type === 'full') {
      return await this.databaseBackup.createFullBackup(jobId, options, location, progressCallback)
    } else if (config.type === 'incremental') {
      // Get last backup time
      const lastBackupTime = await this.getLastBackupTime(config.id)
      return await this.databaseBackup.createIncrementalBackup(jobId, lastBackupTime, options, location, progressCallback)
    } else {
      throw new AppError('지원하지 않는 백업 유형입니다.')
    }
  }

  private async executeFileBackup(
    jobId: string, 
    config: BackupConfig, 
    location: BackupLocation
  ) {
    const options: FileBackupOptions = {
      directories: [
        './public/uploads',
        './documents',
        './logs'
      ],
      exclude_patterns: [
        '*.tmp',
        '*.log',
        'node_modules/**',
        '.git/**'
      ],
      follow_symlinks: false,
      compression: config.compression ? 'tar.gz' : 'none',
      max_file_size: 100 * 1024 * 1024 // 100MB
    }

    const progressCallback = (progress: number) => {
      this.updateJobStatus(jobId, 'running', progress)
    }

    return await this.fileBackup.createFileBackup(jobId, options, location, progressCallback)
  }

  private async executeCombinadBackup(
    jobId: string, 
    config: BackupConfig, 
    location: BackupLocation
  ) {
    // Execute both database and file backups
    const dbResult = await this.executeDatabaseBackup(jobId, config, location)
    
    if (!dbResult.success) {
      return dbResult
    }

    const fileResult = await this.executeFileBackup(jobId, config, location)
    
    return {
      success: dbResult.success && fileResult.success,
      filePath: fileResult.filePath, // Return the combined backup path
      size: (dbResult.size || 0) + (fileResult.size || 0),
      error: fileResult.error || dbResult.error
    }
  }

  private async createBackupJobRecord(config: BackupConfig, trigger: 'manual' | 'scheduled'): Promise<string | null> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('backup_jobs')
        .insert({
          config_id: config.id,
          type: config.type,
          trigger,
          status: 'pending',
          progress: 0,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        logError(error, 'createBackupJobRecord')
        return null
      }

      return data.id
    } catch (error) {
      logError(error, 'createBackupJobRecord')
      return null
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
    progress: number,
    metadata?: Record<string, any>
  ) {
    try {
      const updates: any = {
        status,
        progress
      }

      if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString()
      }

      if (metadata) {
        if (metadata.file_path) updates.file_path = metadata.file_path
        if (metadata.file_size) updates.file_size = metadata.file_size
        if (metadata.compressed_size) updates.compressed_size = metadata.compressed_size
        if (metadata.error_message) updates.error_message = metadata.error_message
        updates.metadata = metadata
      }

      const { error } = await (this.supabase as any)
        .from('backup_jobs')
        .update(updates)
        .eq('id', jobId)

      if (error) {
        logError(error, `updateJobStatus:${jobId}`)
      }
    } catch (error) {
      logError(error, `updateJobStatus:${jobId}`)
    }
  }

  private async getLastBackupTime(configId: string): Promise<string> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('backup_jobs')
        .select('completed_at')
        .eq('config_id', configId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // If no previous backup, use a date far in the past
        return '1970-01-01T00:00:00Z'
      }

      return data.completed_at
    } catch (error) {
      logError(error, `getLastBackupTime:${configId}`)
      return '1970-01-01T00:00:00Z'
    }
  }

  private async updateScheduleLastRun(scheduleId: string) {
    try {
      const now = new Date()
      const { error } = await (this.supabase as any)
        .from('backup_schedules')
        .update({
          last_run: now.toISOString(),
          next_run: this.calculateNextRun(scheduleId, now)
        })
        .eq('id', scheduleId)

      if (error) {
        logError(error, `updateScheduleLastRun:${scheduleId}`)
      }
    } catch (error) {
      logError(error, `updateScheduleLastRun:${scheduleId}`)
    }
  }

  private calculateNextRun(scheduleId: string, from: Date): string {
    const job = this.scheduledJobs.get(scheduleId)
    if (job) {
      return job.nextDate().toJSDate().toISOString()
    }
    return new Date(from.getTime() + 24 * 60 * 60 * 1000).toISOString() // Default: 24 hours
  }

  private async validateAndLogBackup(jobId: string, filePath: string, config: BackupConfig) {
    try {
      let validation: { valid: boolean; error?: string }

      if (config.include_database && !config.include_files) {
        validation = await this.databaseBackup.validateBackup(filePath)
      } else if (config.include_files && !config.include_database) {
        validation = await this.fileBackup.validateBackup(filePath)
      } else {
        // For combined backups, assume valid if file exists and has size
        validation = { valid: true }
      }

      // Log validation result
      const { error } = await (this.supabase as any)
        .from('backup_jobs')
        .update({
          metadata: {
            validated: true,
            validation_result: validation.valid,
            validation_error: validation.error
          }
        })
        .eq('id', jobId)

      if (error) {
        logError(error, `validateAndLogBackup:${jobId}`)
      }

      if (!validation.valid) {
        console.warn(`⚠️ Backup validation failed: ${validation.error}`)
      }
    } catch (error) {
      logError(error, `validateAndLogBackup:${jobId}`)
    }
  }

  private async cleanupOldBackups(config: BackupConfig) {
    try {
      if (config.retention_days <= 0) {
        return // No cleanup needed
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - config.retention_days)

      // Get old backup jobs
      const { data: oldJobs, error } = await (this.supabase as any)
        .from('backup_jobs')
        .select('id, file_path')
        .eq('config_id', config.id)
        .eq('status', 'completed')
        .lt('completed_at', cutoffDate.toISOString())

      if (error) {
        logError(error, `cleanupOldBackups:${config.id}`)
        return
      }

      // Delete old backup files and records
      for (const job of oldJobs || []) {
        try {
          // Delete physical file
          if (job.file_path) {
            const fs = require('fs').promises
            await fs.unlink(job.file_path)
          }

          // Delete database record
          await (this.supabase as any)
            .from('backup_jobs')
            .delete()
            .eq('id', job.id)
        } catch (error) {
          logError(error, `cleanupOldBackups:job:${job.id}`)
        }
      }

      console.log(`🧹 Cleaned up ${oldJobs?.length || 0} old backups for config ${config.id}`)
    } catch (error) {
      logError(error, `cleanupOldBackups:${config.id}`)
    }
  }

  async addSchedule(schedule: Omit<BackupSchedule, 'id' | 'last_run' | 'next_run'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('backup_schedules')
        .insert({
          ...schedule,
          next_run: this.parseNextRun(schedule.cron_expression, schedule.timezone)
        })
        .select('id')
        .single()

      if (error) {
        logError(error, 'addSchedule')
        return { success: false, error: '스케줄 추가에 실패했습니다.' }
      }

      // Create cron job if enabled
      if (schedule.enabled) {
        await this.createScheduledJob({ ...schedule, id: data.id })
      }

      return { success: true, id: data.id }
    } catch (error) {
      logError(error, 'addSchedule')
      return { 
        success: false, 
        error: error instanceof AppError ? error.message : '스케줄 추가 중 오류가 발생했습니다.' 
      }
    }
  }

  async removeSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop cron job
      const job = this.scheduledJobs.get(scheduleId)
      if (job) {
        job.stop()
        this.scheduledJobs.delete(scheduleId)
      }

      // Delete from database
      const { error } = await (this.supabase as any)
        .from('backup_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        logError(error, `removeSchedule:${scheduleId}`)
        return { success: false, error: '스케줄 삭제에 실패했습니다.' }
      }

      return { success: true }
    } catch (error) {
      logError(error, `removeSchedule:${scheduleId}`)
      return { 
        success: false, 
        error: error instanceof AppError ? error.message : '스케줄 삭제 중 오류가 발생했습니다.' 
      }
    }
  }

  private parseNextRun(cronExpression: string, timezone: string): string {
    try {
      const job = new CronJob(cronExpression, () => {}, null, false, timezone)
      return job.nextDate().toJSDate().toISOString()
    } catch (error) {
      logError(error, 'parseNextRun')
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default: 24 hours
    }
  }

  async getRunningJobs(): Promise<string[]> {
    return Array.from(this.runningJobs)
  }

  async cancelJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update job status to cancelled
      const { error } = await (this.supabase as any)
        .from('backup_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          error_message: 'Job cancelled by user'
        })
        .eq('id', jobId)
        .eq('status', 'running') // Only cancel running jobs

      if (error) {
        logError(error, `cancelJob:${jobId}`)
        return { success: false, error: '작업 취소에 실패했습니다.' }
      }

      return { success: true }
    } catch (error) {
      logError(error, `cancelJob:${jobId}`)
      return { 
        success: false, 
        error: error instanceof AppError ? error.message : '작업 취소 중 오류가 발생했습니다.' 
      }
    }
  }
}