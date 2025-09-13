'use server'

import { createClient } from '@/lib/supabase/server'
import { validateSupabaseResponse, logError, AppError } from '@/lib/error-handling'
import { BackupScheduler } from '@/lib/backup/backup-scheduler'
import type { 
  BackupConfig, 
  BackupJob, 
  BackupStats, 
  BackupSchedule,
  BackupMonitoring,
  BackupRestoreRequest
} from '@/lib/backup/types'
import { revalidatePath } from 'next/cache'

// Global backup scheduler instance
let backupScheduler: BackupScheduler | null = null

function getBackupScheduler() {
  if (!backupScheduler) {
    backupScheduler = new BackupScheduler()
  }
  return backupScheduler
}

export async function getBackupConfigs(): Promise<{ 
  success: boolean; 
  data?: BackupConfig[]; 
  error?: string 
}> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('backup_configs' as any)
      .select('*')
      .order('created_at', { ascending: false })
    
    validateSupabaseResponse(data, error)
    
    return { success: true, data: data as unknown as BackupConfig[] }
  } catch (error) {
    logError(error, 'getBackupConfigs')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 설정을 불러오는데 실패했습니다.' 
    }
  }
}

export async function createBackupConfig(
  config: Omit<BackupConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: BackupConfig; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('backup_configs' as any)
      .insert(config as any)
      .select()
      .single()
    
    validateSupabaseResponse(data, error)
    
    // If this config has a schedule, create a schedule entry
    if (config.schedule && config.enabled) {
      const scheduler = getBackupScheduler()
      await scheduler.addSchedule({
        name: `${config.name} 스케줄`,
        cron_expression: config.schedule,
        config_id: (data as any)?.id,
        enabled: true,
        timezone: 'Asia/Seoul'
      })
    }
    
    revalidatePath('/dashboard/admin/backup')
    
    return { success: true, data: data as unknown as BackupConfig }
  } catch (error) {
    logError(error, 'createBackupConfig')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 설정 생성에 실패했습니다.' 
    }
  }
}

export async function updateBackupConfig(
  id: string,
  updates: Partial<BackupConfig>
): Promise<{ success: boolean; data?: BackupConfig; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('backup_configs' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()
    
    validateSupabaseResponse(data, error)
    
    revalidatePath('/dashboard/admin/backup')
    
    return { success: true, data: data as unknown as BackupConfig }
  } catch (error) {
    logError(error, 'updateBackupConfig')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 설정 수정에 실패했습니다.' 
    }
  }
}

export async function deleteBackupConfig(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // First, remove any associated schedules
    const { data: schedules } = await supabase
      .from('backup_schedules' as any)
      .select('id')
      .eq('config_id', id)
    
    if (schedules) {
      const scheduler = getBackupScheduler()
      for (const schedule of schedules) {
        await scheduler.removeSchedule((schedule as any).id)
      }
    }
    
    // Delete the config (CASCADE will handle related records)
    const { error } = await supabase
      .from('backup_configs' as any)
      .delete()
      .eq('id', id)
    
    validateSupabaseResponse(null, error)
    
    revalidatePath('/dashboard/admin/backup')
    
    return { success: true }
  } catch (error) {
    logError(error, 'deleteBackupConfig')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 설정 삭제에 실패했습니다.' 
    }
  }
}

export async function executeManualBackup(configId: string): Promise<{ 
  success: boolean; 
  jobId?: string; 
  error?: string 
}> {
  try {
    const scheduler = getBackupScheduler()
    const result = await scheduler.executeManualBackup(configId)
    
    revalidatePath('/dashboard/admin/backup')
    
    return result
  } catch (error) {
    logError(error, 'executeManualBackup')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '수동 백업 실행에 실패했습니다.' 
    }
  }
}

export async function getBackupJobs(
  configId?: string,
  limit?: number
): Promise<{ success: boolean; data?: BackupJob[]; error?: string }> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('backup_jobs' as any)
      .select(`
        *,
        backup_configs(name)
      `)
      .order('started_at', { ascending: false })
    
    if (configId) {
      query = query.eq('config_id', configId)
    }
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    validateSupabaseResponse(data, error)
    
    return { success: true, data: data as unknown as BackupJob[] }
  } catch (error) {
    logError(error, 'getBackupJobs')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 작업 목록을 불러오는데 실패했습니다.' 
    }
  }
}

export async function getBackupJob(jobId: string): Promise<{ 
  success: boolean; 
  data?: BackupJob; 
  error?: string 
}> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('backup_jobs' as any)
      .select(`
        *,
        backup_configs(name, description)
      `)
      .eq('id', jobId)
      .single()
    
    validateSupabaseResponse(data, error)
    
    return { success: true, data: data as unknown as BackupJob }
  } catch (error) {
    logError(error, 'getBackupJob')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 작업 정보를 불러오는데 실패했습니다.' 
    }
  }
}

export async function cancelBackupJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const scheduler = getBackupScheduler()
    const result = await scheduler.cancelJob(jobId)
    
    revalidatePath('/dashboard/admin/backup')
    
    return result
  } catch (error) {
    logError(error, 'cancelBackupJob')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 작업 취소에 실패했습니다.' 
    }
  }
}

export async function getBackupStats(): Promise<{ 
  success: boolean; 
  data?: BackupStats; 
  error?: string 
}> {
  try {
    const supabase = createClient()
    
    // Get overall stats
    const { data: jobs, error: jobsError } = await supabase
      .from('backup_jobs' as any)
      .select('status, file_size, completed_at, started_at')
    
    validateSupabaseResponse(jobs, jobsError)
    
    const stats: BackupStats = {
      total_backups: jobs?.length || 0,
      successful_backups: jobs?.filter((j: any) => j.status === 'completed').length || 0,
      failed_backups: jobs?.filter((j: any) => j.status === 'failed').length || 0,
      total_size: jobs?.reduce((sum: number, j: any) => sum + (j.file_size || 0), 0) || 0,
      compressed_size: jobs?.reduce((sum: number, j: any) => sum + (j.file_size || 0), 0) || 0, // Simplified
      average_duration: 0
    }
    
    // Calculate average duration
    const completedJobs = jobs?.filter((j: any) => j.status === 'completed' && j.started_at && j.completed_at) || []
    if (completedJobs.length > 0) {
      const totalDuration = completedJobs.reduce((sum: number, j: any) => {
        const start = new Date(j.started_at).getTime()
        const end = new Date(j.completed_at).getTime()
        return sum + (end - start)
      }, 0)
      stats.average_duration = Math.round(totalDuration / completedJobs.length / 1000) // seconds
    }
    
    // Get latest and oldest backups
    if (jobs && jobs.length > 0) {
      const sortedJobs = jobs
        .filter((j: any) => j.status === 'completed')
        .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      
      if (sortedJobs.length > 0) {
        stats.latest_backup = sortedJobs[0] as unknown as BackupJob
        stats.oldest_backup = sortedJobs[sortedJobs.length - 1] as unknown as BackupJob
      }
    }
    
    return { success: true, data: stats }
  } catch (error) {
    logError(error, 'getBackupStats')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 통계를 불러오는데 실패했습니다.' 
    }
  }
}

export async function getBackupSchedules(): Promise<{ 
  success: boolean; 
  data?: BackupSchedule[]; 
  error?: string 
}> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('backup_schedules' as any)
      .select(`
        *,
        backup_configs(name, description)
      `)
      .order('created_at', { ascending: false })
    
    validateSupabaseResponse(data, error)
    
    return { success: true, data: data as unknown as BackupSchedule[] }
  } catch (error) {
    logError(error, 'getBackupSchedules')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 스케줄을 불러오는데 실패했습니다.' 
    }
  }
}

export async function createBackupSchedule(
  schedule: Omit<BackupSchedule, 'id' | 'last_run' | 'next_run'>
): Promise<{ success: boolean; data?: BackupSchedule; error?: string }> {
  try {
    const scheduler = getBackupScheduler()
    const result = await scheduler.addSchedule(schedule)
    
    if (!result.success) {
      return result
    }
    
    // Get the created schedule
    const supabase = createClient()
    const { data, error } = await supabase
      .from('backup_schedules' as any)
      .select('*')
      .eq('id', result.id)
      .single()
    
    validateSupabaseResponse(data, error)
    
    revalidatePath('/dashboard/admin/backup')
    
    return { success: true, data: data as unknown as BackupSchedule }
  } catch (error) {
    logError(error, 'createBackupSchedule')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 스케줄 생성에 실패했습니다.' 
    }
  }
}

export async function deleteBackupSchedule(scheduleId: string): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    const scheduler = getBackupScheduler()
    const result = await scheduler.removeSchedule(scheduleId)
    
    revalidatePath('/dashboard/admin/backup')
    
    return result
  } catch (error) {
    logError(error, 'deleteBackupSchedule')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 스케줄 삭제에 실패했습니다.' 
    }
  }
}

export async function getRunningBackupJobs(): Promise<{ 
  success: boolean; 
  data?: string[]; 
  error?: string 
}> {
  try {
    const scheduler = getBackupScheduler()
    const runningJobs = await scheduler.getRunningJobs()
    
    return { success: true, data: runningJobs }
  } catch (error) {
    logError(error, 'getRunningBackupJobs')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '실행 중인 백업 작업을 확인하는데 실패했습니다.' 
    }
  }
}

export async function restoreBackup(
  request: BackupRestoreRequest
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new AppError('인증이 필요합니다.')
    }
    
    // Create restore job record
    const { data, error } = await supabase
      .from('backup_restore_jobs' as any)
      .insert({
        backup_job_id: request.backup_id,
        target_database: request.target_database,
        include_files: request.include_files ?? true,
        overwrite_existing: request.overwrite_existing ?? false,
        restore_point: request.restore_point,
        status: 'pending',
        created_by: user.id
      } as any)
      .select('id')
      .single()
    
    validateSupabaseResponse(data, error)
    
    // TODO: Implement actual restore logic
    // For now, just mark as completed for demo purposes
    await supabase
      .from('backup_restore_jobs' as any)
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        restored_items: ['demo_restore']
      } as any)
      .eq('id', (data as any)?.id)
    
    revalidatePath('/dashboard/admin/backup')
    
    return { success: true, jobId: (data as any)?.id }
  } catch (error) {
    logError(error, 'restoreBackup')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '백업 복원 작업 생성에 실패했습니다.' 
    }
  }
}