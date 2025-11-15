import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

const DOCUMENT_SELECT_FIELDS = `
        id,
        category_type,
        sub_category,
        file_name,
        file_url,
        title,
        description,
        created_at,
        metadata,
        updated_at,
        uploaded_by,
        file_size,
        mime_type,
        status,
        profiles:profiles!unified_document_system_uploaded_by_fkey(
          full_name,
          role
        )
      `

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()
    const svc = createServiceRoleClient()

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'invoice' // Default to 기성청구 문서
    const type = searchParams.get('type') // document_type filter
    const limit = parseInt(searchParams.get('limit') || '50')
    const q = (searchParams.get('q') || '').trim()

    // Build query for site documents
    let query = supabase
      .from('unified_document_system')
      .select(DOCUMENT_SELECT_FIELDS)
      .eq('site_id', siteId)
      .eq('category_type', category)
      .eq('status', 'active')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply document type filter (using sub_category for filtering in unified_document_system)
    if (type && type !== 'all') {
      query = query.eq('sub_category', type)
    }

    const { data: documentsData, error } = await query

    if (error) {
      console.error('Documents query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }
    let documents = documentsData || []

    // Get document statistics for this site and category
    const { data: statsData } = await supabase
      .from('unified_document_system')
      .select('sub_category, category_type, mime_type, metadata')
      .eq('site_id', siteId)
      .eq('category_type', category)
      .eq('status', 'active')
      .eq('is_archived', false)

    // Create statistics based on mime types for better categorization
    const getDocumentType = (mimeType: string) => {
      if (mimeType?.startsWith('image/')) return 'photo'
      if (mimeType === 'application/pdf') return 'document'
      return 'document'
    }

    const statistics = {
      total_documents: statsData?.length || 0,
      by_type:
        statsData?.reduce(
          (acc: unknown, doc: unknown) => {
            const type = getDocumentType(doc.mime_type || '')
            acc[type] = (acc[type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {},
      category: category,
    }

    const shouldIncludeMarkup =
      category === 'shared' && (!type || type === 'all' || type === 'progress_drawing')

    if (shouldIncludeMarkup) {
      const markupLimit = Math.max(limit, 50)
      let markupQuery = svc
        .from('markup_documents')
        .select(
          `
          id,
          title,
          description,
          created_at,
          site_id,
          created_by,
          linked_worklog_id,
          original_blueprint_url,
          original_blueprint_filename,
          file_size,
          creator:profiles!markup_documents_created_by_fkey(full_name, email)
        `
        )
        .eq('site_id', siteId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(markupLimit)

      if (q) {
        markupQuery = markupQuery.or(`title.ilike.%${q}%,original_blueprint_filename.ilike.%${q}%`)
      }

      const [{ data: markupRows }, { count: markupCount }] = await Promise.all([
        markupQuery,
        svc
          .from('markup_documents')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .eq('is_deleted', false),
      ])

      const mappedMarkup =
        markupRows?.map(row => ({
          id: row.id,
          category_type: 'shared',
          sub_category: 'progress_drawing',
          file_name: row.original_blueprint_filename || row.title || '도면마킹 문서',
          file_url: row.original_blueprint_url,
          title: row.title || row.original_blueprint_filename || '도면마킹 문서',
          description: row.description || '',
          created_at: row.created_at,
          metadata: {
            source_table: 'markup_documents',
            markup_document_id: row.id,
            linked_worklog_id: row.linked_worklog_id,
            readonly: true,
          },
          updated_at: row.created_at,
          uploaded_by: row.created_by,
          file_size: row.file_size || 0,
          mime_type: 'image/png',
          status: 'active',
          profiles: row.creator
            ? {
                full_name: row.creator.full_name,
                role: 'markup_creator',
              }
            : null,
        })) || []

      if (markupCount) {
        statistics.total_documents += markupCount || 0
        const docCount = statistics.by_type?.document || 0
        statistics.by_type = {
          ...statistics.by_type,
          document: docCount + (markupCount || 0),
        }
      }

      if (mappedMarkup.length > 0) {
        documents = [...documents, ...mappedMarkup].sort((a, b) => {
          const at = new Date(a.created_at || 0).getTime()
          const bt = new Date(b.created_at || 0).getTime()
          return bt - at
        })
        documents = documents.slice(0, limit)
      }
    }

    // Get site information for context
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    return NextResponse.json({
      success: true,
      data: documents || [],
      statistics,
      site: siteData,
      filters: {
        site_id: siteId,
        category: category,
        type: type || 'all',
        limit,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
])

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ error: 'Missing site id' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const titleInput = (formData.get('title') as string | null) || ''
    const description = (formData.get('description') as string | null) || ''
    const subCategory = (formData.get('sub_category') as string | null) || ''
    const tagsRaw = (formData.get('tags') as string | null) || ''

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const sanitizedName = sanitizeFilename(file.name)
    const fileExt = sanitizedName.includes('.') ? sanitizedName.split('.').pop() : undefined
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).slice(2, 10)
    const storagePath = `shared/${siteId}/${timestamp}-${randomId}-${sanitizedName}`

    const supabase = createServiceRoleClient()

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('[admin/sites/:id/documents] storage upload failed:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath)
    const title = titleInput || file.name
    const tags = tagsRaw
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    const now = new Date().toISOString()

    const insertPayload: Record<string, any> = {
      title,
      description: description || null,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      category_type: 'shared',
      sub_category: subCategory || null,
      site_id: siteId,
      uploaded_by: authResult.userId,
      status: 'active',
      is_public: true,
      is_archived: false,
      approval_required: false,
      approved_by: null,
      approved_at: null,
      tags: tags.length ? tags : null,
      metadata: {
        source: 'admin_site_shared_upload',
        site_id: siteId,
        sub_category: subCategory || null,
        original_extension: fileExt || null,
        storage_path: storagePath,
      },
      created_at: now,
      updated_at: now,
    }

    const { data: inserted, error: insertError } = await supabase
      .from('unified_document_system')
      .insert(insertPayload)
      .select(DOCUMENT_SELECT_FIELDS)
      .single()

    if (insertError) {
      console.error('[admin/sites/:id/documents] insert failed:', insertError)
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json(
        {
          error: 'Failed to create document record',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: inserted,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[admin/sites/:id/documents] upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ error: 'Missing site id' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      id: documentId,
      title,
      description,
      sub_category: subCategory,
    }: {
      id?: string
      title?: string
      description?: string | null
      sub_category?: string | null
    } = body

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 })
    }

    const updates: Record<string, any> = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title must be a non-empty string' }, { status: 400 })
      }
      updates.title = title.trim()
    }

    if (description !== undefined) {
      if (description === null) updates.description = null
      else if (typeof description === 'string') updates.description = description.trim()
      else
        return NextResponse.json({ error: 'Description must be a string or null' }, { status: 400 })
    }

    let subCategoryValue: string | null | undefined = undefined
    if (subCategory !== undefined) {
      if (subCategory === null) subCategoryValue = null
      else if (typeof subCategory === 'string') subCategoryValue = subCategory.trim() || null
      else
        return NextResponse.json(
          { error: 'sub_category must be a string or null' },
          { status: 400 }
        )
    }

    const hasUpdates = Object.keys(updates).length > 0 || subCategoryValue !== undefined

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: existing, error: fetchError } = await supabase
      .from('unified_document_system')
      .select('id, site_id, category_type, metadata')
      .eq('id', documentId)
      .maybeSingle()

    if (fetchError) {
      console.error('[admin/sites/:id/documents][PATCH] fetch failed:', fetchError)
      return NextResponse.json({ error: 'Failed to lookup document' }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (String(existing.site_id) !== String(siteId) || existing.category_type !== 'shared') {
      return NextResponse.json({ error: 'Document does not belong to this site' }, { status: 400 })
    }

    if (subCategoryValue !== undefined) {
      updates.sub_category = subCategoryValue
      const metadata = safeParseMetadata(existing.metadata)
      updates.metadata = {
        ...metadata,
        sub_category: subCategoryValue,
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('unified_document_system')
      .update(updates)
      .eq('id', documentId)
      .select(DOCUMENT_SELECT_FIELDS)
      .single()

    if (updateError) {
      console.error('[admin/sites/:id/documents][PATCH] update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to update document', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[admin/sites/:id/documents][PATCH] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ error: 'Missing site id' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id') || searchParams.get('document_id')
    if (!docId) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: document, error: fetchError } = await supabase
      .from('unified_document_system')
      .select('id, site_id, category_type, file_url, metadata, file_name')
      .eq('id', docId)
      .maybeSingle()

    if (fetchError) {
      console.error('[admin/sites/:id/documents] fetch for delete failed:', fetchError)
      return NextResponse.json({ error: 'Failed to lookup document' }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (String(document.site_id) !== String(siteId) || document.category_type !== 'shared') {
      return NextResponse.json({ error: 'Document does not belong to this site' }, { status: 400 })
    }

    const metadata = safeParseMetadata(document.metadata)
    const storagePath =
      typeof metadata?.storage_path === 'string' && metadata.storage_path.trim().length > 0
        ? metadata.storage_path
        : null

    const { error: deleteError } = await supabase
      .from('unified_document_system')
      .delete()
      .eq('id', docId)

    if (deleteError) {
      console.error('[admin/sites/:id/documents] delete failed:', deleteError)
      return NextResponse.json(
        {
          error: 'Failed to delete document',
          details: deleteError.message,
        },
        { status: 500 }
      )
    }

    if (storagePath) {
      try {
        const { error: removeError } = await supabase.storage
          .from('documents')
          .remove([storagePath])
        if (removeError) {
          console.warn(
            '[admin/sites/:id/documents] storage cleanup warning:',
            removeError.message || removeError
          )
        }
      } catch (storageCleanupError) {
        console.warn('[admin/sites/:id/documents] storage cleanup error:', storageCleanupError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/sites/:id/documents] delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function safeParseMetadata(
  metadata: unknown
): { storage_path?: string; [key: string]: any } | Record<string, never> {
  if (!metadata) return {}
  if (typeof metadata === 'object' && !Array.isArray(metadata))
    return metadata as Record<string, any>
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      /* ignore */
    }
  }
  return {}
}
