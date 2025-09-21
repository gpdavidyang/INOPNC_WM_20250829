'use server'

import { withAdminAuth, AdminActionResult, AdminErrors } from './common'
import { ADMIN_DOCUMENTS_STUB } from '@/lib/admin/stub-data'
import type { DocumentFile } from '@/types/documents'
import type { DocumentType, ApprovalStatus } from '@/types'

export interface CreateDocumentData {
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size?: number
  mime_type?: string
  document_type: DocumentType
  folder_path?: string
  is_public?: boolean
  site_id?: string
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  id: string
}

export interface DocumentWithApproval extends DocumentFile {
  approval_status?: ApprovalStatus
  approval_requested_at?: string
  approval_comments?: string
  requested_by?: {
    full_name: string
    email: string
  }
}

/**
 * Get all documents with pagination and filtering (admin view)
 */
export async function getDocuments(
  page = 1,
  limit = 10,
  search = '',
  type?: DocumentType,
  approval_status?: ApprovalStatus,
  site_id?: string
): Promise<AdminActionResult<{ documents: DocumentWithApproval[]; total: number; pages: number }>> {
  const shouldUseStubData = !process.env.SUPABASE_SERVICE_ROLE_KEY

  if (shouldUseStubData) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[admin/documents] Using stub data for document list')
    }
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = ADMIN_DOCUMENTS_STUB.filter(doc => {
      const matchesSearch = normalizedSearch
        ? [doc.title, doc.description, doc.file_name]
            .filter(Boolean)
            .some(value => value!.toLowerCase().includes(normalizedSearch))
        : true

      const matchesType = type ? doc.document_type === type : true
      const matchesSite = site_id ? doc.site_id === site_id : true
      const matchesApproval = approval_status ? doc.approval_status === approval_status : true

      return matchesSearch && matchesType && matchesSite && matchesApproval
    })

    const sorted = filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const total = sorted.length
    const pages = Math.max(Math.ceil(total / safeLimit), 1)
    const offset = (safePage - 1) * safeLimit
    const documents = sorted.slice(offset, offset + safeLimit).map(doc => ({
      ...doc,
      owner: doc.owner ? { ...doc.owner } : undefined,
      site: doc.site ? { ...doc.site } : undefined,
      requested_by: doc.requested_by ? { ...doc.requested_by } : undefined,
    })) as DocumentWithApproval[]

    if (process.env.NODE_ENV === 'development') {
      console.info('[admin/documents] stub result', {
        total,
        page: safePage,
        pageSize: safeLimit,
        returned: documents.length,
      })
    }

    return {
      success: true,
      data: {
        documents,
        total,
        pages,
      },
    }
  }

  return withAdminAuth(async supabase => {
    try {
      let query = supabase
        .from('documents')
        .select(
          `
          *,
          owner:profiles!documents_owner_id_fkey(full_name, email),
          site:sites(name),
          approval_requests!left(
            status,
            requested_at,
            comments,
            requested_by:profiles!approval_requests_requested_by_fkey(full_name, email)
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`
        )
      }

      // Apply type filter
      if (type) {
        query = query.eq('document_type', type)
      }

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      // Apply approval status filter
      if (approval_status) {
        query = query.eq('approval_requests.status', approval_status)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: documents, error, count } = await query

      if (error) {
        console.error('Error fetching documents:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR,
        }
      }

      // Transform the data to include approval status
      const transformedDocuments =
        documents?.map((doc: any) => ({
          ...doc,
          approval_status: doc.approval_requests?.[0]?.status,
          approval_requested_at: doc.approval_requests?.[0]?.requested_at,
          approval_comments: doc.approval_requests?.[0]?.comments,
          requested_by: doc.approval_requests?.[0]?.requested_by,
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
      console.error('Documents fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Approve or reject document requests (bulk operation)
 */
export async function processDocumentApprovals(
  documentIds: string[],
  action: 'approve' | 'reject',
  comments?: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected'

      // Update approval requests
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status,
          approved_by: profile.id,
          processed_at: new Date().toISOString(),
          comments,
        })
        .in('entity_id', documentIds)
        .eq('request_type', 'document')
        .eq('status', 'pending')

      if (error) {
        console.error('Error processing document approvals:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // If approved, make documents public
      if (action === 'approve') {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ is_public: true })
          .in('id', documentIds)

        if (updateError) {
          console.error('Error updating document visibility:', updateError)
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }
      }

      const actionText = action === 'approve' ? '승인' : '거부'
      return {
        success: true,
        message: `${documentIds.length}개 문서가 ${actionText}되었습니다.`,
      }
    } catch (error) {
      console.error('Document approval processing error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Delete documents (bulk operation)
 */
export async function deleteDocuments(documentIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async supabase => {
    try {
      // Delete documents (this will cascade to approval requests)
      const { error } = await supabase.from('documents').delete().in('id', documentIds)

      if (error) {
        console.error('Error deleting documents:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${documentIds.length}개 문서가 성공적으로 삭제되었습니다.`,
      }
    } catch (error) {
      console.error('Documents deletion error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Update document type or visibility (bulk operation)
 */
export async function updateDocumentProperties(
  documentIds: string[],
  updates: { document_type?: DocumentType; is_public?: boolean; site_id?: string }
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async supabase => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', documentIds)

      if (error) {
        console.error('Error updating document properties:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${documentIds.length}개 문서의 속성이 업데이트되었습니다.`,
      }
    } catch (error) {
      console.error('Document property update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get document approval statistics
 */
export async function getDocumentApprovalStats(): Promise<
  AdminActionResult<{
    pending: number
    approved: number
    rejected: number
    total_documents: number
  }>
> {
  return withAdminAuth(async supabase => {
    try {
      // Get approval request counts
      const { data: approvalStats, error: approvalError } = await supabase
        .from('approval_requests')
        .select('status')
        .eq('request_type', 'document')

      if (approvalError) {
        console.error('Error fetching approval stats:', approvalError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get total document count
      const { count: totalDocuments, error: countError } = await supabase
        .from('documents')
        .select('id', { count: 'exact' })

      if (countError) {
        console.error('Error fetching document count:', countError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const stats = {
        pending: approvalStats?.filter((a: any) => a.status === 'pending').length || 0,
        approved: approvalStats?.filter((a: any) => a.status === 'approved').length || 0,
        rejected: approvalStats?.filter((a: any) => a.status === 'rejected').length || 0,
        total_documents: totalDocuments || 0,
      }

      return {
        success: true,
        data: stats,
      }
    } catch (error) {
      console.error('Document stats fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get shared documents for unified view
 */
export async function getSharedDocuments(): Promise<AdminActionResult<DocumentWithApproval[]>> {
  return withAdminAuth(async supabase => {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select(
          `
          *,
          owner:profiles!documents_owner_id_fkey(full_name, email),
          site:sites(name)
        `
        )
        .eq('folder_path', '/shared')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching shared documents:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: documents || [],
      }
    } catch (error) {
      console.error('Shared documents fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get all documents from various document folders for unified view
 */
export async function getAllUnifiedDocuments(): Promise<AdminActionResult<DocumentWithApproval[]>> {
  return withAdminAuth(async supabase => {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select(
          `
          *,
          owner:profiles!documents_owner_id_fkey(full_name, email),
          site:sites(name)
        `
        )
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all unified documents:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: documents || [],
      }
    } catch (error) {
      console.error('All unified documents fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get available sites for document assignment
 */
export async function getAvailableSitesForDocuments(): Promise<
  AdminActionResult<Array<{ id: string; name: string }>>
> {
  return withAdminAuth(async supabase => {
    try {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching available sites for documents:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: sites || [],
      }
    } catch (error) {
      console.error('Available sites for documents fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}
