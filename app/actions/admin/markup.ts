'use server'

import { withAdminAuth, AdminActionResult, AdminErrors } from './common'
import type { MarkupDocument } from '@/types/markup'
import type { MarkupDocumentPermission } from '@/types'

export interface MarkupDocumentWithStats extends MarkupDocument {
  shared_count?: number
  view_count?: number
  last_accessed?: string
  permissions?: MarkupDocumentPermission[]
  creator?: {
    full_name: string
    email: string
  }
  site?: {
    name: string
  }
}

export interface MarkupDocumentFilter {
  search: string
  location: 'all' | 'personal' | 'shared'
  site_id?: string
  created_by?: string
}

/**
 * Get all markup documents with admin oversight
 */
export async function getMarkupDocuments(
  page = 1,
  limit = 10,
  search = '',
  _location?: 'personal' | 'shared', // Deprecated: location field removed from schema
  site_id?: string,
  created_by?: string
): Promise<
  AdminActionResult<{ documents: MarkupDocumentWithStats[]; total: number; pages: number }>
> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      console.log('Admin auth passed, profile:', {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      })
      let query = supabase
        .from('markup_documents')
        .select(
          `
          *,
          creator:profiles!markup_documents_created_by_fkey(full_name, email),
          site:sites(name)
        `,
          { count: 'exact' }
        )
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,original_blueprint_filename.ilike.%${search}%`
        )
      }

      // Note: location filter removed as location column no longer exists in schema
      // if (_location) {
      //   query = query.eq('location', _location)
      // }

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      // Apply creator filter
      if (created_by) {
        query = query.eq('created_by', created_by)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: documents, error, count } = await query

      if (error) {
        console.error('Error fetching markup documents:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR,
        }
      }

      // Transform the data to include stats
      const transformedDocuments =
        documents?.map((doc: unknown) => ({
          ...doc,
          shared_count: 0, // TODO: Get from permissions later
          view_count: 0, // TODO: Implement view tracking
          last_accessed: null, // TODO: Implement access tracking
          permissions: [], // TODO: Get permissions separately if needed
        })) || []

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          documents: transformedDocuments,
          total: count || 0,
          pages: totalPages,
        },
      }
    } catch (error) {
      console.error('Markup documents fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Delete markup documents (bulk operation)
 */
export async function deleteMarkupDocuments(
  documentIds: string[]
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async supabase => {
    try {
      // Soft delete markup documents
      const { error } = await supabase
        .from('markup_documents')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', documentIds)

      if (error) {
        console.error('Error deleting markup documents:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${documentIds.length}개 마킹 문서가 성공적으로 삭제되었습니다.`,
      }
    } catch (error) {
      console.error('Markup documents deletion error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Update markup document properties (bulk operation)
 */
export async function updateMarkupDocumentProperties(
  documentIds: string[],
  updates: {
    // location?: 'personal' | 'shared' // Deprecated: location field removed from schema
    site_id?: string
    title?: string
    description?: string
  }
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async supabase => {
    try {
      const { error } = await supabase
        .from('markup_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', documentIds)

      if (error) {
        console.error('Error updating markup document properties:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${documentIds.length}개 마킹 문서의 속성이 업데이트되었습니다.`,
      }
    } catch (error) {
      console.error('Markup document property update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Grant or revoke document permissions (bulk operation)
 */
export async function manageMarkupDocumentPermissions(
  documentIds: string[],
  action: 'grant' | 'revoke',
  userId?: string,
  permissionType?: 'view' | 'edit' | 'admin'
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      if (action === 'grant') {
        if (!userId || !permissionType) {
          return { success: false, error: '사용자 ID와 권한 타입이 필요합니다.' }
        }

        // Grant permissions
        const permissions = documentIds.map(documentId => ({
          document_id: documentId,
          user_id: userId,
          permission_type: permissionType,
          granted_by: profile.id,
          granted_at: new Date().toISOString(),
        }))

        const { error } = await supabase.from('markup_document_permissions').upsert(permissions, {
          onConflict: 'document_id,user_id',
          ignoreDuplicates: false,
        })

        if (error) {
          console.error('Error granting markup document permissions:', error)
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }

        return {
          success: true,
          message: `${documentIds.length}개 문서에 대한 권한이 부여되었습니다.`,
        }
      } else {
        // Revoke permissions
        let query = supabase
          .from('markup_document_permissions')
          .delete()
          .in('document_id', documentIds)

        if (userId) {
          query = query.eq('user_id', userId)
        }

        const { error } = await query

        if (error) {
          console.error('Error revoking markup document permissions:', error)
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }

        return {
          success: true,
          message: `${documentIds.length}개 문서의 권한이 취소되었습니다.`,
        }
      }
    } catch (error) {
      console.error('Markup document permission management error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get markup document usage statistics
 */
export async function getMarkupDocumentStats(): Promise<
  AdminActionResult<{
    total_documents: number
    personal_documents: number
    shared_documents: number
    total_permissions: number
    active_users: number
    storage_used: number
  }>
> {
  return withAdminAuth(async supabase => {
    try {
      // Get document counts
      const { data: documents, error: docsError } = await supabase
        .from('markup_documents')
        .select('file_size, created_by')
        .eq('is_deleted', false)

      if (docsError) {
        console.error('Error fetching markup document stats:', docsError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get permission counts (simplified for now)
      const permissionCount = 0 // TODO: Implement when needed

      const totalDocuments = documents?.length || 0
      // Note: personal/shared distinction removed from schema
      const personalDocuments = 0 // No longer applicable
      const sharedDocuments = totalDocuments // All documents are now unified
      const storageUsed =
        documents?.reduce((sum: number, doc: unknown) => sum + (doc.file_size || 0), 0) || 0
      const activeUsers = new Set(documents?.map((d: unknown) => d.created_by)).size || 0

      const stats = {
        total_documents: totalDocuments,
        personal_documents: personalDocuments,
        shared_documents: sharedDocuments,
        total_permissions: permissionCount,
        active_users: activeUsers,
        storage_used: Math.round((storageUsed / (1024 * 1024)) * 100) / 100, // MB
      }

      return {
        success: true,
        data: stats,
      }
    } catch (error) {
      console.error('Markup document stats fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get users for permission assignment
 */
export async function getAvailableUsersForPermissions(): Promise<
  AdminActionResult<
    Array<{
      id: string
      full_name: string
      email: string
      role: string
    }>
  >
> {
  return withAdminAuth(async supabase => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('status', ['active'])
        .order('full_name')

      if (error) {
        console.error('Error fetching available users for permissions:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: users || [],
      }
    } catch (error) {
      console.error('Available users for permissions fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}
