'use server'

import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { normalizeRequiredDocStatus } from '@/lib/documents/status'
import { fetchLinkedDrawingsForWorklog } from '@/lib/documents/worklog-links'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  CompanyDoc,
  DrawingItem,
  DrawingWorklog,
  MyDoc,
  PhotoGroup,
  PhotoItem,
} from './doc-hub-data'

export async function fetchMyDocs(): Promise<MyDoc[]> {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    console.warn('fetchMyDocs: Auth failed')
    return []
  }
  const userId = auth.userId

  const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
  const supabase = createServiceRoleClient()

  try {
    // Fetch all active required document types
    const { data: requiredTypes, error: typesError } = await supabase
      .from('required_document_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (typesError) {
      console.error('Error fetching required types:', typesError)
      return []
    }

    // Fetch submissions for the user
    // We also want to fetch linked documents. Since FK might be missing, we'll do it manually if needed,
    // but first let's try to fetch IDs and then query 'documents' table.
    // Fetch submissions for the user
    // We fetch profiles separately to avoid relationship ambiguity (PGRST201)
    const { data: submissions, error: subError } = await supabase
      .from('user_document_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('Error fetching my docs (submissions):', subError)
      return []
    }

    // Fetch uploader profile names separately
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', submissions?.map(s => s.user_id).filter(Boolean) || [])

    const profileMap = new Map<string, string>()
    profiles?.forEach(p => profileMap.set(p.id, p.full_name))

    // Attach profile name to submissions for downstream logic
    submissions?.forEach(sub => {
      if (sub.user_id) {
        sub.profile = { full_name: profileMap.get(sub.user_id) }
      }
    })

    // 2. Fetch linked documents if any
    const docIds = new Set<string>()
    submissions?.forEach(sub => {
      if (sub.document_id) docIds.add(sub.document_id)
    })

    const docMap = new Map<string, any>()
    if (docIds.size > 0) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, file_url, title')
        .in('id', Array.from(docIds))

      docs?.forEach(d => docMap.set(d.id, d))
    }

    // Map submissions by requirement_id (primary) or document_type_id (legacy)
    const submissionMap = new Map<string, any>()
    if (submissions) {
      for (const sub of submissions) {
        const typeId = sub.requirement_id || sub.document_type_id
        if (typeId && !submissionMap.has(typeId)) {
          submissionMap.set(typeId, sub)
        }
      }
    }

    const results: MyDoc[] = (requiredTypes || []).map((type: any) => {
      const sub = submissionMap.get(type.id)
      let status = normalizeRequiredDocStatus(sub?.submission_status)

      // Resolve file URL
      let fileUrl = sub?.file_url
      if (!fileUrl && sub?.document_id) {
        const linkedDoc = docMap.get(sub.document_id)
        if (linkedDoc) {
          fileUrl = linkedDoc.file_url
        }
      }

      let hasFile = Boolean(fileUrl) // Strict check: must have URL

      let dateDisplay = '-'

      if (sub?.submitted_at) {
        dateDisplay = new Date(sub.submitted_at).toISOString().split('T')[0]
      }

      const profileData = Array.isArray(sub?.profile) ? sub.profile[0] : sub?.profile
      const authorName = profileData?.full_name || (sub ? '본인' : '-')

      return {
        id: sub?.id ? String(sub.id) : `req-${type.id}`,
        typeId: type.id,
        title: type.name_ko || type.name_en || '필수서류',
        desc: type.description || '',
        status: status,
        date: dateDisplay,
        author: authorName,
        fileName: sub?.file_name || '-',
        endDate: sub?.metadata?.end_date || undefined,
        hasFile: hasFile,
        fileUrl: fileUrl || undefined,
      }
    })

    return results
  } catch (err) {
    console.error('fetchMyDocs outer error:', err)
    return []
  }
}

export async function fetchCompanyDocs(): Promise<CompanyDoc[]> {
  const supabase = createClient()

  // 1. Fetch active company document types
  const { data: types, error: typesError } = await supabase
    .from('company_document_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (typesError) {
    console.error('Error fetching company doc types:', typesError)
    return []
  }

  // 2. Fetch shared documents from unified_documents primarily
  const richSelect = `
    *,
    uploader:profiles!uploaded_by(id, full_name, role)
  `

  let { data: docs, error: docsError } = await supabase
    .from('unified_documents')
    .select(richSelect)
    .eq('category_type', 'shared')
    .in('status', ['uploaded', 'active', 'approved', 'draft'])
    .order('created_at', { ascending: false })

  if (docsError || !docs || docs.length === 0) {
    if (docsError) console.warn('unified_documents fetch failed:', docsError)
    // Fallback to unified_document_system
    const fallback = await supabase
      .from('unified_document_system')
      .select(richSelect)
      .eq('category_type', 'shared')
      .order('created_at', { ascending: false })
    docs = fallback.data
  }

  const { detectCompanyDocSlug } = await import('@/lib/documents/company-types')

  // Map documents to their slugs
  const docsBySlug = new Map<string, any[]>()
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      const slug = detectCompanyDocSlug(doc as any)
      if (slug) {
        if (!docsBySlug.has(slug)) docsBySlug.set(slug, [])
        docsBySlug.get(slug)!.push(doc)
      }
    })
  }

  // 3. Return types with their documents
  // Note: We currently flatten to 1-to-1 for the UI cards, but showing the latest one
  const results: CompanyDoc[] = []

  for (const type of types || []) {
    const docsForType = docsBySlug.get(type.slug) || []
    const doc = docsForType[0] // Latest one

    const fileExt = doc?.file_name
      ? doc.file_name.split('.').pop()?.toUpperCase()
      : doc?.file_type?.split('/').pop()?.toUpperCase() || ''

    const dateDisplay = doc ? new Date(doc.created_at).toISOString().split('T')[0] : '-'
    const fileSizeMB = doc?.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(1)}MB` : '-'
    const authorName = doc?.uploader?.full_name || (doc ? '관리자' : '-')

    results.push({
      id: doc ? String(doc.id) : `type-${type.id}`,
      title: type.name || doc?.title || doc?.file_name || '제목 없음',
      category: type.description || '공통',
      date: dateDisplay,
      author: authorName,
      fileName: doc?.file_name || '-',
      fileType: fileExt,
      fileSize: fileSizeMB,
      url: doc?.file_url || undefined,
    })
  }

  return results
}

export async function fetchDrawings(searchQuery?: string): Promise<DrawingWorklog[]> {
  const supabase = createClient()

  let query = supabase
    .from('daily_reports')
    .select(
      `
        id, work_date, site_id, work_content, created_by, status, member_name,
        component_name, work_process, process_type, work_section,
        sites!inner(name)
     `
    )
    .order('work_date', { ascending: false })
    .limit(50)

  if (searchQuery) {
    // Basic text search on daily_reports fields
    // We cannot easily OR with joined table columns in a single .or() clause efficiently without specific indexes/RPC.
    // For now, we'll filter mainly by work_content/member_name OR if the site name matches, relying on post-filtering or independent fetch?
    // Let's stick to PostgREST filter for local columns.
    // To support Site Name search, we might need to filter !inner joined table.
    // Let's try a hybrid: if searchQuery looks like a Site Name, we filter site.
    // But generic text search is best done in memory for small datasets or specialized RPC.
    // Given the "Hub" context, let's fetch a bit more and filter in memory for best UX including Site Name match.
    // We'll just apply a loose filter on DB to reduce volume if possible, but 'limit 50' + in-memory filter is safer for complex ORs.
    // Actually, let's just fetch 50 (or 100) and filter in JS. It is robust enough for now.
    query = query.limit(100)
  } else {
    query = query.limit(20)
  }

  const { data: reports, error } = await query

  if (error) {
    console.error('Error fetching reports for drawings:', error)
    return []
  }

  const results: DrawingWorklog[] = []
  const qLower = searchQuery?.toLowerCase() || ''

  for (const report of reports || []) {
    const site = Array.isArray(report.sites) ? report.sites[0] : report.sites
    const siteName = site?.name || '현장'
    const authorName = report.member_name || '작성자'
    const content = report.work_content || ''

    // In-memory Filter if query exists
    if (qLower) {
      const matches =
        siteName.toLowerCase().includes(qLower) ||
        authorName.toLowerCase().includes(qLower) ||
        (typeof content === 'string' && content.toLowerCase().includes(qLower)) ||
        (report.component_name && String(report.component_name).toLowerCase().includes(qLower)) ||
        (report.work_description && String(report.work_description).toLowerCase().includes(qLower))

      if (!matches) continue
    }

    // 1. Calculate Description (Work Content) - Prioritize Flat DB Columns
    const extractDetails = () => {
      const parts: string[] = []

      // A. Prefer Flat Columns (Most Robust & Maintainable)
      // Component / Member Name
      const cName = report.component_name || report.member_name
      if (cName && String(cName).trim()) parts.push(String(cName).trim())

      // Work Section / Location
      const wSection = report.work_section
      if (wSection && String(wSection).trim()) parts.push(String(wSection).trim())

      // Process Type / Work Process
      const pType = report.work_process || report.process_type
      if (pType && String(pType).trim()) parts.push(String(pType).trim())

      // B. Fallback to work_content JSON ONLY if flat columns are completely empty
      if (parts.length === 0) {
        if (
          typeof report.work_content === 'object' &&
          report.work_content !== null &&
          Array.isArray(report.work_content.tasks)
        ) {
          report.work_content.tasks.forEach((t: any) => {
            if (t.member_name || t.component_type)
              parts.push(String(t.member_name || t.component_type))
            if (t.location || t.work_section) parts.push(String(t.location || t.work_section))
            if (t.content || t.process_type) parts.push(String(t.content || t.process_type))
          })
        }
      }

      // C. Final Fallback to raw content if still empty
      if (
        parts.length === 0 &&
        typeof report.work_content === 'string' &&
        report.work_content.trim()
      ) {
        parts.push(report.work_content.trim())
      }

      // Deduplicate and join with ' | '
      const detailsStr = Array.from(new Set(parts.filter(Boolean))).join(' | ')
      return detailsStr
    }

    const details = extractDetails()
    const workContentInfo = details ? `작업일지 - ${details}` : '작업일지'

    const linked = await fetchLinkedDrawingsForWorklog(report.id, report.site_id)
    // if (linked.length > 0) { // REMOVED FILTER: Show all worklogs to allow uploading
    const drawingItems: DrawingItem[] = linked.map(d => ({
      id: String(d.id),
      title: d.title,
      type: d.documentType === 'blueprint' ? 'blueprint' : 'progress',
      source: d.source === 'markup' || d.source === 'shared' ? d.source : 'file',
      date: d.createdAt ? d.createdAt.split('T')[0] : report.work_date,
      url: d.previewUrl || d.url,
    }))

    results.push({
      id: String(report.id),
      siteId: String(report.site_id),
      type: 'worklog',
      date: report.work_date,
      siteName: siteName, // The actual Site Name
      desc: workContentInfo, // The Work Info (Location/Process)
      author: authorName,
      status: report.status === 'approved' ? 'done' : 'pending',
      drawings: drawingItems,
    })
    // }
  }

  return results
}

export async function fetchPhotos(): Promise<PhotoGroup[]> {
  const supabase = createClient()

  const normalizeUrl = (value: any): string | null => {
    if (typeof value === 'string' && value.trim()) return value
    if (value && typeof value === 'object') {
      const url =
        value.url ||
        value.display_url ||
        value.original_url ||
        value.thumbnail_url ||
        value.file_url ||
        value.publicUrl
      if (typeof url === 'string' && url.trim()) return url
    }
    return null
  }

  const normalizeAfterPhotoUrls = (report: any): string[] => {
    const additional = Array.isArray(report?.additional_after_photos)
      ? report.additional_after_photos
      : null
    if (additional) {
      return additional.map(normalizeUrl).filter(Boolean) as string[]
    }

    const legacy = Array.isArray(report?.after_photos) ? report.after_photos : null
    if (legacy) {
      return legacy.map(normalizeUrl).filter(Boolean) as string[]
    }

    return []
  }

  let reports: any[] | null = null
  {
    const { data, error } = await supabase
      .from('daily_reports')
      .select(
        `
        id, work_date, site_id, work_content, created_by, additional_after_photos, member_name,
        sites(name)
    `
      )
      .order('work_date', { ascending: false })
      .limit(50)

    if (error) {
      // Backward-compat: some schemas still use legacy after_photos
      if (error.code === '42703') {
        const legacy = await supabase
          .from('daily_reports')
          .select(
            `
            id, work_date, site_id, work_content, created_by, after_photos, member_name,
            sites(name)
        `
          )
          .order('work_date', { ascending: false })
          .limit(50)

        if (legacy.error) {
          console.error('Error fetching photos:', legacy.error)
          return []
        }
        reports = legacy.data || []
      } else {
        console.error('Error fetching photos:', error)
        return []
      }
    } else {
      reports = data || []
    }
  }

  return (reports || [])
    .map((report: any) => {
      const photoUrls = normalizeAfterPhotoUrls(report)
      if (photoUrls.length === 0) return null

      const photoItems: PhotoItem[] = photoUrls.map((url, idx) => ({
        id: `${String(report.id)}-p${idx}`,
        url: url,
        tags: ['시공후'],
        date: report.work_date,
      }))

      const site = Array.isArray(report.sites) ? report.sites[0] : report.sites

      return {
        id: String(report.id),
        title: site?.name || '현장',
        contractor: '협력사',
        affiliation: '협력업체',
        author: report.member_name || '작성자',
        date: report.work_date,
        desc: report.work_content,
        photos: photoItems,
      }
    })
    .filter(Boolean) as PhotoGroup[]
}
export async function fetchPunchList(): Promise<PunchGroup[]> {
  return []
}

export async function uploadUserDocumentAction(formData: FormData) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return { success: false, error: 'Unauthorized' }
  }
  const userId = auth.userId

  const file = formData.get('file') as File
  const requirementId = formData.get('requirementId') as string
  const documentId = formData.get('documentId') as string | null

  if (!file || !requirementId) {
    return { success: false, error: 'Missing file or requirementId' }
  }

  try {
    // 1. Upload to Storage
    // We use userId as siteId for personal docs, and 'other' as generic type
    const { uploadSiteDocument } = await import('@/lib/supabase/storage')
    const { publicUrl, fileName } = await uploadSiteDocument(file, userId, 'other')

    // 2. Upsert Submission Record
    // Use service role to bypass RLS for the insert/update
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabase = createServiceRoleClient()
    const timestamp = new Date().toISOString()

    // Sanitize filename for DB to avoid length/encoding issues
    // normalized for consistent storage (NFC is standard for web)
    const dbFileName = fileName.normalize('NFC').substring(0, 100)

    const payload: any = {
      user_id: userId,
      requirement_id: requirementId,
      document_id: documentId || null,
      submission_status: 'submitted', // DB constraint allows 'submitted', maps to 'pending' in UI
      file_url: publicUrl,
      file_name: dbFileName,
      submitted_at: timestamp,
      updated_at: timestamp,
    }

    // Check if exists to determine insert vs update (for clean upsert)
    // specific logic to avoid overwriting approved_at unless we want to reset it?
    // Usually a new upload resets status to pending.
    const { data: existing, error: findError } = await supabase
      .from('user_document_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('requirement_id', requirementId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 is "The result contains 0 rows" which is expected for new submissions
      console.error('Error finding existing submission:', findError)
      // Continue to try insert if find failed? No, unsafe.
      // But if it's just "not found", we proceed.
    }

    let error
    if (existing) {
      const { error: updateError } = await supabase
        .from('user_document_submissions')
        .update({
          ...payload,
          approved_at: null, // Reset approval
          rejected_at: null,
          rejection_reason: null,
        })
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('user_document_submissions')
        .insert(payload)
      error = insertError
    }

    if (error) {
      console.error('Database update failed:', error)
      return {
        success: false,
        error: `Database update failed: ${error.message || JSON.stringify(error)}`,
      }
    }

    // 3. Revalidate
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')

    return { success: true }
  } catch (err: any) {
    console.error('Upload action error:', err)
    return { success: false, error: err.message || 'Upload failed' }
  }
}

export async function deleteUserDocumentsAction(submissionIds: string[]) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return { success: false, error: 'Unauthorized' }
  }
  const userId = auth.userId
  const supabase = createClient()

  if (!submissionIds.length) return { success: true, count: 0 }

  try {
    // 1. Fetch submissions to validate
    const { data: submissions, error: fetchError } = await supabase
      .from('user_document_submissions')
      .select('id, user_id, submission_status')
      .in('id', submissionIds)
      .eq('user_id', userId) // Ensure ownership

    if (fetchError || !submissions) {
      return { success: false, error: 'Failed to fetch submissions' }
    }

    // 2. Filter deletable (exclude approved)
    const deletable = submissions.filter(sub => sub.submission_status !== 'approved')
    const approvedCount = submissions.length - deletable.length

    if (deletable.length === 0) {
      if (approvedCount > 0) return { success: false, error: '승인된 문서는 삭제할 수 없습니다.' }
      return { success: true, count: 0 }
    }

    // 3. Delete Records
    const idsToDelete = deletable.map(s => s.id)
    const { error: deleteError } = await supabase
      .from('user_document_submissions')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return { success: false, error: 'Delete failed' }
    }

    // 4. Revalidate
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')

    const message =
      approvedCount > 0
        ? `승인된 ${approvedCount}건을 제외하고 ${idsToDelete.length}건이 삭제되었습니다.`
        : `${idsToDelete.length}건이 삭제되었습니다.`

    return {
      success: true,
      count: idsToDelete.length,
      message: message,
    }
  } catch (err: any) {
    console.error('Delete action error:', err)
    return { success: false, error: err.message || 'Delete failed' }
  }
}
export async function deleteDrawingsAction(drawingIds: string[]) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return { success: false, error: 'Unauthorized' }
  }
  const supabase = createClient()

  if (!drawingIds.length) return { success: true, count: 0 }

  try {
    // We don't know the source here (markup vs shared) just from IDs easily without a query.
    // However, we can try to delete from both or fetch first.
    // Since IDs are UUIDs, we can fetch from both tables.

    // 1. Fetch from markup_documents
    const { data: markups } = await supabase
      .from('markup_documents')
      .select('id')
      .in('id', drawingIds)

    const markupIds = markups?.map(m => m.id) || []

    // 2. Fetch from unified_document_system
    const { data: shared } = await supabase
      .from('unified_document_system')
      .select('id')
      .in('id', drawingIds)

    const sharedIds = shared?.map(s => s.id) || []

    // 3. Delete Markups (Soft delete is preferred)
    if (markupIds.length > 0) {
      await supabase.from('markup_documents').update({ is_deleted: true }).in('id', markupIds)
    }

    // 4. Delete Shared (Archive or Delete)
    if (sharedIds.length > 0) {
      await supabase
        .from('unified_document_system')
        .update({ status: 'deleted', is_archived: true })
        .in('id', sharedIds)
    }

    // 5. Revalidate
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')

    const total = markupIds.length + sharedIds.length
    return {
      success: true,
      count: total,
      message: `${total}건의 도면이 삭제되었습니다.`,
    }
  } catch (err: any) {
    console.error('Delete drawings error:', err)
    return { success: false, error: err.message || 'Delete failed' }
  }
}
export async function uploadDrawingAction(formData: FormData) {
  // Recompile trigger: 2026-02-07 21:58
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return { success: false, error: 'Unauthorized' }
  }
  const userId = auth.userId
  const supabase = createClient()

  const file = formData.get('file') as File
  const reportId = formData.get('reportId') as string
  const siteId = formData.get('siteId') as string
  const docType = formData.get('docType') as string // 'progress' | 'blueprint'
  const originalName = formData.get('originalName') as string // Optional explicit name

  if (!file || !reportId || !siteId) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    // 1. Upload to Storage
    const { uploadSiteDocument } = await import('@/lib/supabase/storage')
    const { publicUrl, fileName } = await uploadSiteDocument(
      file,
      siteId,
      docType === 'blueprint' ? 'blueprint' : 'other',
      originalName // Use originalName if provided to avoid mangling
    )

    // 2. Insert into unified_document_system
    const { data, error } = await supabase
      .from('unified_document_system')
      .insert({
        title: fileName,
        file_url: publicUrl,
        file_name: fileName,
        site_id: siteId,
        category_type: 'shared',
        sub_category: docType === 'blueprint' ? 'blueprint' : 'progress_drawing',
        status: 'active',
        is_archived: false,
        uploaded_by: userId,
        metadata: {
          linked_worklog_id: reportId,
          source_table: 'upload',
          uploaded_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) throw error

    // 3. Revalidate
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')

    return { success: true, drawing: data }
  } catch (err: any) {
    console.error('Upload drawing error:', err)
    return { success: false, error: err.message || 'Upload failed' }
  }
}
