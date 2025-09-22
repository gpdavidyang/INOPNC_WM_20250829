'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import type { Database } from '@/types/database'
import type { MarkupDocument } from '@/types/markup'
import type { MarkupDocumentPermission } from '@/types'
import {
  withAdminAuth,
  type AdminActionResult,
  AdminErrors,
  requireRestrictedOrgId,
  resolveAdminError,
} from './common'

type AdminSupabaseClient = SupabaseClient<Database>

export interface MarkupDocumentWithStats extends Omit<MarkupDocument, 'permissions'> {
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
    organization_id?: string | null
  }
}

export interface MarkupDocumentFilter {
  search: string
  location: 'all' | 'personal' | 'shared'
  site_id?: string
  created_by?: string
}

async function ensureSiteAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  siteId?: string | null
) {
  if (!auth.isRestricted || !siteId) {
    return
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  const organizationId = (data as { organization_id?: string | null }).organization_id ?? undefined
  await assertOrgAccess(auth, organizationId)

  if (organizationId !== restrictedOrgId) {
    throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function ensureMarkupDocumentsAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  documentIds: string[]
) {
  if (!auth.isRestricted || documentIds.length === 0) {
    return
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const { data, error } = await supabase
    .from('markup_documents')
    .select('id, site:sites(organization_id)')
    .in('id', documentIds)

  if (error) {
    throw new AppError('마킹 문서를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = (data || []) as Array<{ id: string; site?: { organization_id?: string | null } | null }>

  if (records.length !== documentIds.length) {
    throw new AppError('마킹 문서에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }

  for (const record of records) {
    const organizationId = record.site?.organization_id ?? undefined
    await assertOrgAccess(auth, organizationId)

    if (organizationId !== restrictedOrgId) {
      throw new AppError('마킹 문서에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }
  }
}

async function filterMarkupDocumentsByOrganization<T extends { site_id?: string | null }>(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  documents: T[] | null | undefined
) {
  if (!auth.isRestricted) {
    return documents || []
  }

  const list = documents || []
  if (list.length === 0) {
    return []
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const siteIds = Array.from(
    new Set(list.map(doc => doc.site_id).filter((id): id is string => Boolean(id)))
  )

  if (siteIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id, organization_id')
    .in('id', siteIds)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const orgMap = new Map<string, string | null | undefined>()
  for (const site of data || []) {
    orgMap.set((site as { id: string }).id, (site as { organization_id?: string | null }).organization_id)
  }

  for (const [, organizationId] of orgMap) {
    await assertOrgAccess(auth, organizationId ?? undefined)
  }

  return list.filter(doc => orgMap.get(doc.site_id ?? '') === restrictedOrgId)
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
      const auth = profile.auth
      let query = supabase
        .from('markup_documents')
        .select(
          `
          *,
          creator:profiles!markup_documents_created_by_fkey(full_name, email),
          site:sites(name, organization_id)
        `,
          { count: 'exact' }
        )
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (auth.isRestricted) {
        query = query.eq('site.organization_id', requireRestrictedOrgId(auth))
      }

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,original_blueprint_filename.ilike.%${search}%`
        )
      }

      if (site_id) {
        await ensureSiteAccessible(supabase, auth, site_id)
        query = query.eq('site_id', site_id)
      }

      if (created_by) {
        query = query.eq('created_by', created_by)
      }

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

      const filteredDocuments = await filterMarkupDocumentsByOrganization(supabase, auth, documents as any[])

      const transformedDocuments = filteredDocuments.map((doc: any) => ({
        ...doc,
        shared_count: 0,
        view_count: 0,
        last_accessed: null,
        permissions: [],
      })) as MarkupDocumentWithStats[]

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
        error: resolveAdminError(error),
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
  return withAdminAuth(async (supabase, profile) => {
    try {
      await ensureMarkupDocumentsAccessible(supabase, profile.auth, documentIds)

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
        error: resolveAdminError(error),
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
    site_id?: string
    title?: string
    description?: string
  }
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureMarkupDocumentsAccessible(supabase, auth, documentIds)

      if (updates.site_id) {
        await ensureSiteAccessible(supabase, auth, updates.site_id)
      }

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
        error: resolveAdminError(error),
      }
    }
  })
}
