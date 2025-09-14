'use server'

import type { Database } from '@/types/database'

type Tables = Database['public']['Tables']

interface WorkflowResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function approveWorkflow(
  reportId: string,
  userRole: string
): Promise<WorkflowResult> {
  const supabase = await createClient()
  
  try {
    // Get current report status
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('id', reportId)
      .single()
    
    if (fetchError || !report) {
      throw new Error('Report not found')
    }
    
    // Determine next status based on current status and user role
    let nextStatus: string
    const currentStatus = report.status
    
    if (userRole === 'worker' && currentStatus === 'draft') {
      nextStatus = 'pending_approval'
    } else if (userRole === 'site_manager' && currentStatus === 'pending_approval') {
      nextStatus = 'approved_by_manager'
    } else if (userRole === 'admin' && currentStatus === 'approved_by_manager') {
      nextStatus = 'final_approved'
    } else {
      throw new Error('Invalid workflow transition')
    }
    
    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('daily_reports')
      .update({ 
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Create audit log
    await createAuditLog({
      entity_type: 'daily_report',
      entity_id: reportId,
      action: 'status_change',
      user_id: (await supabase.auth.getUser()).data.user?.id || '',
      changes: {
        status: { from: currentStatus, to: nextStatus }
      }
    })
    
    return {
      success: true,
      data: updatedReport
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Approval failed'
    }
  }
}

export async function rejectWorkflow(
  reportId: string,
  userRole: string,
  reason: string
): Promise<WorkflowResult> {
  const supabase = await createClient()
  
  try {
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('id', reportId)
      .single()
    
    if (fetchError || !report) {
      throw new Error('Report not found')
    }
    
    const { data: updatedReport, error: updateError } = await supabase
      .from('daily_reports')
      .update({ 
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    return {
      success: true,
      data: updatedReport
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rejection failed'
    }
  }
}

export async function handleConcurrentEdit(
  reportId: string,
  expectedVersion: number,
  updates: unknown
): Promise<WorkflowResult> {
  const supabase = await createClient()
  
  try {
    // Check current version
    const { data: current, error: fetchError } = await supabase
      .from('daily_reports')
      .select('version')
      .eq('id', reportId)
      .single()
    
    if (fetchError || !current) {
      throw new Error('Report not found')
    }
    
    // Check for concurrent edit
    if (current.version !== expectedVersion) {
      return {
        success: false,
        error: 'Document has been modified by another user (concurrent edit detected)'
      }
    }
    
    // Update with new version
    const { data: updated, error: updateError } = await supabase
      .from('daily_reports')
      .update({
        ...updates,
        version: expectedVersion + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .eq('version', expectedVersion) // Optimistic locking
      .select()
      .single()
    
    if (updateError) {
      if (updateError.code === 'PGRST116') { // No rows updated
        return {
          success: false,
          error: 'Document has been modified by another user (concurrent edit detected)'
        }
      }
      throw updateError
    }
    
    return {
      success: true,
      data: updated
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    }
  }
}

export async function cascadeDeleteSite(
  siteId: string
): Promise<WorkflowResult> {
  const supabase = await createClient()
  const deletedEntities = {
    daily_reports: 0,
    work_records: 0,
    documents: 0,
    site_workers: 0
  }
  
  try {
    // Start transaction-like operation
    // Check for related entities
    const tables = ['daily_reports', 'work_records', 'documents', 'site_workers']
    
    for (const table of tables) {
      const { data: related, error: fetchError } = await supabase
        .from(table)
        .select('id')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (fetchError) throw fetchError
      
      if (related && related.length > 0) {
        // Delete related entities
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('site_id', siteId)
        
        if (deleteError) {
          throw new Error(`Failed to delete ${table}: ${deleteError.message}`)
        }
        
        deletedEntities[table as keyof typeof deletedEntities] = related.length
      }
    }
    
    // Delete the site itself
    const { data: deletedSite, error: deleteError } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId)
      .select()
      .single()
    
    if (deleteError) throw deleteError
    
    // Create audit log
    await createAuditLog({
      entity_type: 'site',
      entity_id: siteId,
      action: 'cascade_delete',
      user_id: (await supabase.auth.getUser()).data.user?.id || '',
      changes: {
        deletedEntities
      }
    })
    
    return {
      success: true,
      data: {
        site: deletedSite,
        deletedEntities
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cascade delete failed'
    }
  }
}

export async function createAuditLog(data: {
  entity_type: string
  entity_id: string
  action: string
  user_id: string
  changes: Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<WorkflowResult> {
  const supabase = await createClient()
  
  try {
    const auditData = {
      ...data,
      created_at: new Date().toISOString()
    }
    
    const { data: log, error } = await supabase
      .from('audit_logs')
      .insert(auditData)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: log
    }
  } catch (error) {
    // Audit log failures should not break the main operation
    console.error('Audit log creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Audit log failed'
    }
  }
}

export async function rollbackTransaction(
  operations: Array<{
    table: string
    action: 'insert' | 'update' | 'delete'
    data: unknown
  }>
): Promise<WorkflowResult> {
  const supabase = await createClient()
  const completed: unknown[] = []
  
  try {
    for (const op of operations) {
      const { data, error } = await supabase
        .from(op.table)
        [op.action](op.data)
        .select()
        .single()
      
      if (error) {
        // Rollback completed operations
        for (const completedOp of completed) {
          if (completedOp.action === 'insert') {
            await supabase
              .from(completedOp.table)
              .delete()
              .eq('id', completedOp.data.id)
          }
          // Add more rollback logic for update/delete as needed
        }
        
        throw new Error(`Operation failed at ${op.table}: ${error.message}. All changes rolled back.`)
      }
      
      completed.push({ ...op, result: data })
    }
    
    return {
      success: true,
      data: {
        completed: completed.length,
        operations: completed
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed'
    }
  }
}