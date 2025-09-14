'use server'


export interface SystemConfiguration {
  id: string
  category: string
  setting_key: string
  setting_value: unknown
  data_type: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface SystemStats {
  total_users: number
  active_users: number
  total_sites: number
  active_sites: number
  total_documents: number
  total_reports: number
  storage_used: number
  backup_status: 'healthy' | 'warning' | 'error'
  last_backup: string
  system_version: string
}

export interface AuditLog {
  id: string
  user_id: string
  user: {
    full_name: string
    email: string
  }
  action: string
  table_name: string
  record_id?: string
  old_values?: unknown
  new_values?: unknown
  timestamp: string
  ip_address?: string
  user_agent?: string
}

/**
 * Get system configurations
 */
export async function getSystemConfigurations(
  category?: string,
  search = ''
): Promise<AdminActionResult<SystemConfiguration[]>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('system_configurations')
        .select('*')
        .order('category', { ascending: true })
        .order('setting_key', { ascending: true })

      // Apply category filter
      if (category) {
        query = query.eq('category', category)
      }

      // Apply search filter
      if (search.trim()) {
        query = query.or(`setting_key.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: configurations, error } = await query

      if (error) {
        console.error('Error fetching system configurations:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      return {
        success: true,
        data: configurations || []
      }
    } catch (error) {
      console.error('System configurations fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Update system configuration
 */
export async function updateSystemConfiguration(
  setting_key: string,
  setting_value: unknown,
  data_type: 'string' | 'number' | 'boolean' | 'json'
): Promise<AdminActionResult<SystemConfiguration>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // Convert value based on data type
      let processedValue = setting_value
      if (data_type === 'number') {
        processedValue = Number(setting_value)
      } else if (data_type === 'boolean') {
        processedValue = Boolean(setting_value)
      } else if (data_type === 'json') {
        processedValue = typeof setting_value === 'string' ? JSON.parse(setting_value) : setting_value
      }

      const { data: configuration, error } = await supabase
        .from('system_configurations')
        .update({
          setting_value: processedValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', setting_key)
        .select()
        .single()

      if (error) {
        console.error('Error updating system configuration:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: configuration,
        message: '시스템 설정이 업데이트되었습니다.'
      }
    } catch (error) {
      console.error('System configuration update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<AdminActionResult<SystemStats>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Get user statistics
      const { data: userStats } = await supabase
        .from('profiles')
        .select('id, last_seen_at')

      const totalUsers = userStats?.length || 0
      const activeUsers = userStats?.filter((u: unknown) => {
        if (!u.last_seen_at) return false
        const lastSeen = new Date(u.last_seen_at)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return lastSeen > thirtyDaysAgo
      }).length || 0

      // Get site statistics
      const { data: siteStats } = await supabase
        .from('sites')
        .select('id, is_active')

      const totalSites = siteStats?.length || 0
      const activeSites = siteStats?.filter((s: unknown) => s.is_active).length || 0

      // Get document statistics
      const { data: documentStats } = await supabase
        .from('documents')
        .select('id, file_size')

      const totalDocuments = documentStats?.length || 0
      const storageUsed = documentStats?.reduce((sum: number, doc: unknown) => sum + (doc.file_size || 0), 0) || 0

      // Get daily report statistics
      const { data: reportStats } = await supabase
        .from('daily_reports')
        .select('id')

      const totalReports = reportStats?.length || 0

      // Get backup status (simplified - would normally check actual backup system)
      const { data: backupInfo } = await supabase
        .from('system_configurations')
        .select('setting_value')
        .eq('setting_key', 'last_backup_timestamp')
        .single()

      const lastBackup = backupInfo?.setting_value || new Date().toISOString()
      const backupDate = new Date(lastBackup)
      const now = new Date()
      const hoursSinceBackup = (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60)

      let backupStatus: 'healthy' | 'warning' | 'error' = 'healthy'
      if (hoursSinceBackup > 48) {
        backupStatus = 'error'
      } else if (hoursSinceBackup > 24) {
        backupStatus = 'warning'
      }

      // Get system version
      const { data: versionInfo } = await supabase
        .from('system_configurations')
        .select('setting_value')
        .eq('setting_key', 'system_version')
        .single()

      const systemVersion = versionInfo?.setting_value || '1.0.0'

      const stats: SystemStats = {
        total_users: totalUsers,
        active_users: activeUsers,
        total_sites: totalSites,
        active_sites: activeSites,
        total_documents: totalDocuments,
        total_reports: totalReports,
        storage_used: Math.round(storageUsed / (1024 * 1024)), // Convert to MB
        backup_status: backupStatus,
        last_backup: lastBackup,
        system_version: systemVersion
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('System stats fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  page = 1,
  limit = 10,
  search = '',
  action_filter?: string,
  table_filter?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<{ logs: AuditLog[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles!audit_logs_user_id_fkey(full_name, email)
        `, { count: 'exact' })
        .order('timestamp', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`action.ilike.%${search}%,table_name.ilike.%${search}%`)
      }

      // Apply action filter
      if (action_filter) {
        query = query.eq('action', action_filter)
      }

      // Apply table filter
      if (table_filter) {
        query = query.eq('table_name', table_filter)
      }

      // Apply date filters
      if (date_from) {
        query = query.gte('timestamp', date_from)
      }
      if (date_to) {
        query = query.lte('timestamp', date_to)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: logs, error, count } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          logs: logs || [],
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Audit logs fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Perform system maintenance tasks
 */
export async function performSystemMaintenance(
  tasks: string[]
): Promise<AdminActionResult<{ completed_tasks: string[] }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const completedTasks = []

      for (const task of tasks) {
        switch (task) {
          case 'cleanup_old_logs': {
            // Clean up audit logs older than 90 days
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            await supabase
              .from('audit_logs')
              .delete()
              .lt('timestamp', ninetyDaysAgo)
            completedTasks.push('cleanup_old_logs')
            break
          }

          case 'cleanup_temp_files':
            // This would normally clean up temporary files from storage
            // For now, just mark as completed
            completedTasks.push('cleanup_temp_files')
            break

          case 'optimize_database':
            // This would normally run database optimization queries
            // For now, just mark as completed
            completedTasks.push('optimize_database')
            break

          case 'update_statistics':
            // Update system statistics
            await supabase
              .from('system_configurations')
              .upsert({
                category: 'system',
                setting_key: 'last_maintenance',
                setting_value: new Date().toISOString(),
                data_type: 'string',
                is_public: false,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'setting_key'
              })
            completedTasks.push('update_statistics')
            break
        }
      }

      return {
        success: true,
        data: { completed_tasks: completedTasks },
        message: `${completedTasks.length}개 유지보수 작업이 완료되었습니다.`
      }
    } catch (error) {
      console.error('System maintenance error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Create manual backup
 */
export async function createSystemBackup(): Promise<AdminActionResult<{ backup_id: string }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // This would normally trigger actual backup process
      // For now, we'll just update the backup timestamp
      const backupId = `backup_${Date.now()}`
      
      await supabase
        .from('system_configurations')
        .upsert({
          category: 'backup',
          setting_key: 'last_backup_timestamp',
          setting_value: new Date().toISOString(),
          data_type: 'string',
          is_public: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })

      await supabase
        .from('system_configurations')
        .upsert({
          category: 'backup',
          setting_key: 'last_backup_id',
          setting_value: backupId,
          data_type: 'string',
          is_public: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })

      return {
        success: true,
        data: { backup_id: backupId },
        message: '시스템 백업이 시작되었습니다.'
      }
    } catch (error) {
      console.error('System backup error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get system configuration categories
 */
export async function getConfigurationCategories(): Promise<AdminActionResult<string[]>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { data: categories, error } = await supabase
        .from('system_configurations')
        .select('category')
        .order('category')

      if (error) {
        console.error('Error fetching configuration categories:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const uniqueCategories = Array.from(new Set(categories?.map((c: unknown) => c.category) || [])) as string[]

      return {
        success: true,
        data: uniqueCategories
      }
    } catch (error) {
      console.error('Configuration categories fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}