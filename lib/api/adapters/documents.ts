import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type {
  ListDocumentsRequest,
  ListDocumentsResponse,
  DocumentDetail,
  DocumentVersion,
  DocumentDownloadInfo,
} from '../contracts/documents'

export async function listSharedDocuments(
  req: ListDocumentsRequest
): Promise<ListDocumentsResponse> {
  const supabase = createClient()
  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('unified_document_system')
    .select(
      'id, title, status, created_at, site:sites(id,name), uploader:profiles!unified_document_system_uploaded_by_fkey(full_name,email)',
      { count: 'exact' }
    )
    .eq('category_type', 'shared')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (req.search) query = query.ilike('title', `%${req.search}%`)
  if (req.siteId) query = query.eq('site_id', req.siteId)
  if (req.status) query = query.eq('status', req.status)

  const { data, count, error } = await query
  if (error) return { items: [], total: 0 }
  return { items: (data || []) as any, total: count || 0 }
}

export async function listInvoiceDocuments(
  req: ListDocumentsRequest
): Promise<ListDocumentsResponse> {
  const supabase = createClient()
  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('unified_document_system')
    .select(
      'id, title, status, created_at, site:sites(id,name), uploader:profiles!unified_document_system_uploaded_by_fkey(full_name,email)',
      { count: 'exact' }
    )
    .eq('category_type', 'invoice')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (req.search) query = query.ilike('title', `%${req.search}%`)
  if (req.siteId) query = query.eq('site_id', req.siteId)
  if (req.status) query = query.eq('status', req.status)

  const { data, count, error } = await query
  if (error) return { items: [], total: 0 }
  return { items: (data || []) as any, total: count || 0 }
}

export async function listPhotoGridReports(
  req: ListDocumentsRequest
): Promise<ListDocumentsResponse> {
  const supabase = createClient()
  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('photo_sheets')
    .select(
      `id,
       title,
       status,
       created_at,
       site_id,
       orientation,
       rows,
       cols,
       site:sites!photo_sheets_site_id_fkey(id,name),
       creator:profiles!photo_sheets_created_by_fkey(full_name,email)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (req.search) query = query.ilike('title', `%${req.search}%`)
  if (req.siteId) query = query.eq('site_id', req.siteId)
  if (req.status) query = query.eq('status', req.status)

  const { data, count, error } = await query
  if (error) {
    console.error('[listPhotoGridReports] failed to load photo_sheets:', error)
    return { items: [], total: 0 }
  }
  const items = (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    created_at: r.created_at,
    site: r.site || null,
    uploader: r.creator || null,
    category_type: 'photo_grid',
  }))
  return { items, total: count || 0 }
}

export async function listMarkupDocuments(
  req: ListDocumentsRequest
): Promise<ListDocumentsResponse> {
  const supabase = createClient()
  const page = req.page ?? 1
  const pageSize = req.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('markup_documents')
    .select(
      'id, title, description, created_at, site:sites(id,name), creator:profiles!markup_documents_created_by_fkey(full_name,email)',
      { count: 'exact' }
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (req.search) query = query.or(`title.ilike.%${req.search}%,description.ilike.%${req.search}%`)
  if (req.siteId) query = query.eq('site_id', req.siteId)

  const { data, count, error } = await query
  if (error) return { items: [], total: 0 }
  const items = (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    status: null,
    created_at: r.created_at,
    site: r.site || null,
    uploader: r.creator || null,
    category_type: 'markup',
  }))
  return { items, total: count || 0 }
}

// Detail fetchers
export async function getMarkupDocumentDetail(id: string): Promise<DocumentDetail | null> {
  const supabase = createClient()
  // Try unified system first (preferred)
  const { data: uni } = await supabase
    .from('unified_document_system')
    .select(
      `id, title, description, status, category_type, created_at, updated_at,
       file_name, file_size, mime_type, file_url,
       site:sites(id,name),
       uploader:profiles!unified_document_system_uploaded_by_fkey(full_name,email),
       metadata`
    )
    .eq('id', id)
    .eq('category_type', 'markup')
    .maybeSingle()
  if (uni) {
    return uni as unknown as DocumentDetail
  }
  // Fallback to legacy markup_documents
  const { data: legacy } = await supabase
    .from('markup_documents' as any)
    .select(
      `id, title, description, status, created_at, updated_at,
       file_name, file_size, mime_type, file_url,
       site:sites(id,name),
       creator:profiles!markup_documents_created_by_fkey(full_name,email)`
    )
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle()
  if (!legacy) return null
  return {
    id: (legacy as any).id,
    title: (legacy as any).title,
    description: (legacy as any).description,
    status: (legacy as any).status,
    category_type: 'markup',
    created_at: (legacy as any).created_at,
    site: (legacy as any).site || null,
    uploader: (legacy as any).creator || null,
    file_name: (legacy as any).file_name,
    file_size: (legacy as any).file_size,
    mime_type: (legacy as any).mime_type,
    file_url: (legacy as any).file_url,
    metadata: null,
  }
}

export async function listMarkupDocumentVersions(id: string): Promise<DocumentVersion[]> {
  const supabase = createClient()
  const { data: versions } = await supabase
    .from('markup_documents' as any)
    .select(
      `id, version_number, title, description, created_at, is_latest_version,
       creator:profiles!markup_documents_created_by_fkey(full_name,email)`
    )
    .or(`id.eq.${id},parent_document_id.eq.${id}`)
    .eq('is_deleted', false)
    .order('version_number', { ascending: false })
  return (versions || []).map((v: any) => ({
    id: v.id,
    version: v.version_number,
    version_number: v.version_number,
    title: v.title,
    description: v.description,
    created_at: v.created_at,
    created_by: v.creator || null,
    is_latest_version: !!v.is_latest_version,
  }))
}

export async function getMarkupDocumentDownloadUrl(
  id: string
): Promise<DocumentDownloadInfo | null> {
  const supabase = createClient()
  const { data: doc } = await supabase
    .from('unified_document_system')
    .select('id, file_url, file_name, mime_type, file_size')
    .eq('id', id)
    .maybeSingle()
  let url = (doc as any)?.file_url as string | undefined
  let filename = (doc as any)?.file_name as string | undefined
  let contentType = (doc as any)?.mime_type as string | undefined
  let size = (doc as any)?.file_size as number | undefined

  if (!url) {
    const { data: legacy } = await supabase
      .from('markup_documents' as any)
      .select('file_url as url, file_name as name, mime_type, file_size')
      .eq('id', id)
      .maybeSingle()
    url = (legacy as any)?.url
    filename = (legacy as any)?.name
    contentType = (legacy as any)?.mime_type
    size = (legacy as any)?.file_size
  }
  if (!url) return null

  // If it's a public storage URL, optionally convert to signed URL for admin download
  try {
    const marker = '/storage/v1/object/public/'
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      const rest = url.slice(idx + marker.length)
      const slash = rest.indexOf('/')
      if (slash !== -1) {
        const bucket = rest.slice(0, slash)
        const path = rest.slice(slash + 1)
        const service = createServiceRoleClient()
        const { data } = await service.storage.from(bucket).createSignedUrl(path, 3600)
        if (data?.signedUrl) url = data.signedUrl
      }
    }
  } catch {
    // best-effort; fall back to original URL
  }

  return { url, filename: filename || null, contentType: contentType || null, size: size ?? null }
}

export async function getPhotoGridReportDetail(id: string): Promise<DocumentDetail | null> {
  const supabase = createClient()
  const { data: sheet, error: sheetError } = await supabase
    .from('photo_sheets')
    .select(
      `id,
       title,
       status,
       created_at,
       updated_at,
       orientation,
       rows,
       cols,
       site:sites!photo_sheets_site_id_fkey(id,name),
       creator:profiles!photo_sheets_created_by_fkey(full_name,email)`
    )
    .eq('id', id)
    .maybeSingle()
  if (sheet) {
    return {
      id: (sheet as any).id,
      title: (sheet as any).title,
      status: (sheet as any).status,
      category_type: 'photo_grid',
      created_at: (sheet as any).created_at,
      site: (sheet as any).site || null,
      uploader: (sheet as any).creator || null,
      file_name: null,
      file_size: null,
      mime_type: null,
      file_url: null,
      metadata: {
        orientation: (sheet as any).orientation,
        rows: (sheet as any).rows,
        cols: (sheet as any).cols,
        source: 'photo_sheets',
      },
    }
  }

  if (sheetError && sheetError.code !== 'PGRST116') {
    console.error('[getPhotoGridReportDetail] photo_sheets error:', sheetError)
  }

  const { data, error } = await supabase
    .from('photo_grid_reports')
    .select(
      `id, title, status, created_at, updated_at,
       file_name, file_size, mime_type, file_url,
       daily_report:daily_reports(work_date, site:sites(id,name)),
       generated_by_profile:profiles!generated_by(full_name,email)`
    )
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: (data as any).id,
    title: (data as any).title,
    status: (data as any).status,
    category_type: 'photo_grid',
    created_at: (data as any).created_at,
    site: (data as any).daily_report?.site || null,
    uploader: (data as any).generated_by_profile || null,
    file_name: (data as any).file_name,
    file_size: (data as any).file_size,
    mime_type: (data as any).mime_type,
    file_url: (data as any).file_url,
    description: null,
    metadata: null,
  }
}

export async function getPhotoGridReportDownloadUrl(
  id: string
): Promise<DocumentDownloadInfo | null> {
  const supabase = createClient()

  // New photo_sheets entries do not store pre-generated PDFs.
  const { data: sheet } = await supabase
    .from('photo_sheets')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (sheet) {
    return null
  }

  const { data } = await supabase
    .from('photo_grid_reports')
    .select('file_url, file_name, mime_type, file_size, download_count')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  // Increment counters (best-effort)
  try {
    const current = (data as any).download_count || 0
    await supabase
      .from('photo_grid_reports')
      .update({ download_count: current + 1, last_downloaded_at: new Date().toISOString() })
      .eq('id', id)
  } catch (e) {
    console.warn('[getPhotoGridReportDownloadUrl] counter update failed:', e)
  }
  return {
    url: (data as any).file_url,
    filename: (data as any).file_name,
    contentType: (data as any).mime_type,
    size: (data as any).file_size,
  }
}

export async function listPhotoGridReportVersions(id: string): Promise<DocumentVersion[]> {
  const supabase = createClient()

  const { data: sheet } = await supabase
    .from('photo_sheets')
    .select(
      `id,
       title,
       created_at,
       creator:profiles!photo_sheets_created_by_fkey(full_name,email)`
    )
    .eq('id', id)
    .maybeSingle()
  if (sheet) {
    return [
      {
        id: (sheet as any).id,
        version: 1,
        version_number: 1,
        title: (sheet as any).title,
        description: null,
        created_at: (sheet as any).created_at,
        created_by: (sheet as any).creator || null,
        is_latest_version: true,
      },
    ]
  }

  // If versioning exists, return records; otherwise, return current version only if present
  const { data } = await supabase
    .from('photo_grid_reports')
    .select('id, version, created_at, generated_by_profile:profiles!generated_by(full_name,email)')
    .eq('id', id)
    .maybeSingle()
  if (!data) return []
  return [
    {
      id: (data as any).id,
      version: (data as any).version ?? 1,
      version_number: (data as any).version ?? 1,
      title: null,
      description: null,
      created_at: (data as any).created_at,
      created_by: (data as any).generated_by_profile || null,
      is_latest_version: true,
    },
  ]
}
