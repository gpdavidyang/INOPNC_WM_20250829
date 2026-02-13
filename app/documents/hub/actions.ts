'use server'

import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { normalizeRequiredDocStatus } from '@/lib/documents/status'
import { fetchLinkedDrawingsForWorklog } from '@/lib/documents/worklog-links'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'
import { CompanyDoc, DrawingItem, DrawingWorklog, MyDoc, PhotoGroup } from './doc-hub-data'

export async function fetchMyDocs(): Promise<MyDoc[]> {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    console.warn('fetchMyDocs: Auth failed')
    return []
  }
  const userId = auth.userId

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

  console.log(
    `[fetchCompanyDocs] Types: ${types?.length}, Docs: ${Array.isArray(docs) ? docs.length : 0}, Mapped Items: ${results.length}, WithURL: ${results.filter(r => r.url).length}`
  )

  return results
}

export async function fetchDrawings(
  searchQuery?: string,
  siteName?: string
): Promise<DrawingWorklog[]> {
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

  if (siteName && siteName !== 'all') {
    query = query.eq('sites.name', siteName)
  }

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
    query = query.limit(50)
  }

  const { data: reports, error } = await query

  if (error) {
    console.error('Error fetching reports for drawings:', error)
    return []
  }

  const qLower = searchQuery?.toLowerCase() || ''

  const results = await Promise.all(
    (reports || []).map(async report => {
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
          (report.work_description &&
            String(report.work_description).toLowerCase().includes(qLower))

        if (!matches) return null
      }

      // 1. Calculate Description (Work Content) - Prioritize Flat DB Columns
      const extractDetails = () => {
        const parts: string[] = []

        // A. Prefer Flat Columns (Most Robust & Maintainable)
        // 1. Component / Member Name (부재명)
        const cName = report.component_name || report.member_name
        if (cName && String(cName).trim()) parts.push(String(cName).trim())

        // 2. Process Type / Work Process (작업공정)
        const pType = report.work_process || report.process_type
        if (pType && String(pType).trim()) parts.push(String(pType).trim())

        // 3. Work Section / Location (작업유형/위치)
        const wSection = report.work_section
        if (wSection && String(wSection).trim()) parts.push(String(wSection).trim())

        // B. Fallback to work_content JSON ONLY if flat columns are completely empty
        if (parts.length === 0) {
          if (
            typeof report.work_content === 'object' &&
            report.work_content !== null &&
            Array.isArray(report.work_content.tasks)
          ) {
            report.work_content.tasks.forEach((t: any) => {
              // 1. Component
              if (t.member_name || t.component_type)
                parts.push(String(t.member_name || t.component_type))
              // 2. Process
              if (t.content || t.process_type) parts.push(String(t.content || t.process_type))
              // 3. Section/Location
              if (t.location || t.work_section) parts.push(String(t.location || t.work_section))
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
        type: (() => {
          const docType = String(d.documentType || '')
            .trim()
            .toLowerCase()
          if (docType.includes('blueprint')) return 'blueprint'
          if (
            docType.includes('completion') ||
            docType.includes('done') ||
            docType.includes('final')
          )
            return 'completion'
          if (docType.includes('progress')) return 'progress'
          return 'progress'
        })(),
        source: d.source === 'markup' || d.source === 'shared' ? d.source : 'file',
        date: d.createdAt ? d.createdAt.split('T')[0] : report.work_date,
        url: d.previewUrl || d.url,
        originalUrl: d.originalUrl || d.url,
        markupData: d.markupData,
        markupId: d.markupId,
      }))

      return {
        id: String(report.id),
        siteId: String(report.site_id),
        type: 'worklog',
        date: report.work_date,
        siteName: siteName, // The actual Site Name
        desc: workContentInfo, // The Work Info (Location/Process)
        author: authorName,
        status: report.status === 'approved' ? 'done' : 'pending',
        drawings: drawingItems,
      } as DrawingWorklog
    })
  )

  return results.filter(Boolean) as DrawingWorklog[]
}

export async function fetchPhotos(siteName?: string): Promise<PhotoGroup[]> {
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

  const normalizeAfterPhotoUrls = (
    report: any,
    fieldName: string = 'additional_after_photos'
  ): string[] => {
    const additional = Array.isArray(report?.[fieldName]) ? report[fieldName] : null
    if (additional) {
      return additional.map(normalizeUrl).filter(Boolean) as string[]
    }

    // Legacy fallback only for after photos
    if (fieldName === 'additional_after_photos') {
      const legacy = Array.isArray(report?.after_photos) ? report.after_photos : null
      if (legacy) {
        return legacy.map(normalizeUrl).filter(Boolean) as string[]
      }
    }

    return []
  }

  let reports: any[] | null = null
  {
    let query = supabase.from('daily_reports').select(
      `
        id, work_date, site_id, work_content, created_by, created_at, status, additional_after_photos, additional_before_photos, member_name,
        component_name, work_process, process_type, work_section,
        sites(name)
      `
    )

    if (siteName && siteName !== 'all') {
      query = query.eq('sites.name', siteName)
    }

    const { data, error } = await query.order('work_date', { ascending: false }).limit(300)

    if (error) {
      // Backward-compat: some schemas still use legacy after_photos
      if (error.code === '42703') {
        let legacyQuery = supabase.from('daily_reports').select(
          `
            id, work_date, site_id, work_content, created_by, after_photos, member_name,
            component_name, work_process, process_type, work_section,
            sites(name)
        `
        )

        if (siteName && siteName !== 'all') {
          legacyQuery = legacyQuery.eq('sites.name', siteName)
        }

        const legacy = await legacyQuery.order('work_date', { ascending: false }).limit(300)

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
    console.log('[fetchPhotos] Fetched reports count:', reports?.length)
    if (reports && reports.length > 0) {
      // Side-load photos from daily_report_additional_photos table
      // Side-load photos combining multiple sources
      const reportIds = reports.map((r: any) => r.id)
      const photoMap = new Map<
        string,
        {
          before: { url: string; source: any; ref?: string }[]
          after: { url: string; source: any; ref?: string }[]
          ing: { url: string; source: any; ref?: string }[] // Added 'ing'
        }
      >()
      const svc = createServiceRoleClient()

      // Source 1: daily_report_additional_photos
      try {
        const { data: additional, error: err1 } = await svc
          .from('daily_report_additional_photos')
          .select('id, daily_report_id, photo_type, file_url, file_path') // Added id
          .in('daily_report_id', reportIds)
          .order('upload_order', { ascending: true })

        if (!err1 && additional) {
          // Collect paths to sign (assuming bucket is 'daily-reports')
          const pathsToSign = additional
            .map((p: any) => p.file_path)
            .filter((path: any) => typeof path === 'string' && path.length > 0) as string[]

          const signedMap = new Map<string, string>()
          if (pathsToSign.length > 0) {
            try {
              const { data: signedData } = await svc.storage
                .from('daily-reports')
                .createSignedUrls(pathsToSign, 60 * 60) // 1 hour validity

              if (signedData) {
                signedData.forEach(s => {
                  if (s.path && s.signedUrl) {
                    signedMap.set(s.path, s.signedUrl)
                  }
                })
              }
            } catch (signErr) {
              console.warn('[fetchPhotos] Failed to sign URLs:', signErr)
            }
          }

          additional.forEach((p: any) => {
            const url = p.file_path ? signedMap.get(p.file_path) : p.file_url
            const finalUrl = url || p.file_url
            if (!finalUrl) return

            if (!photoMap.has(p.daily_report_id)) {
              photoMap.set(p.daily_report_id, { before: [], after: [], ing: [] }) // Initialize 'ing'
            }
            const entry = photoMap.get(p.daily_report_id)!
            const item = { url: finalUrl, source: 'add_photo', ref: p.id }
            if (p.photo_type === 'before') entry.before.push(item)
            else if (p.photo_type === 'after') entry.after.push(item)
            else if (p.photo_type === 'ing')
              entry.ing.push(item) // Handle 'ing' type
            else entry.after.push(item) // Default to after if type is unknown
          })
        } else if (err1) {
          console.warn('[fetchPhotos] additional_photos query error:', err1)
        }
      } catch (e) {
        console.warn('[fetchPhotos] Failed to load additional_photos:', e)
      }

      // Source 2: document_attachments (Legacy / Mobile uploads)
      try {
        const { data: attachments, error: err2 } = await svc
          .from('document_attachments')
          .select('id, daily_report_id, file_url') // Added id
          .in('daily_report_id', reportIds)
          .eq('document_type', 'photo')

        if (!err2 && attachments) {
          attachments.forEach((att: any) => {
            if (!att.file_url) return
            if (!photoMap.has(att.daily_report_id)) {
              photoMap.set(att.daily_report_id, { before: [], after: [] })
            }
            // Treat generic attachments as 'after' photos
            photoMap.get(att.daily_report_id)!.after.push({
              url: att.file_url,
              source: 'doc_attach',
              ref: att.id,
            })
          })
        }
      } catch (e) {
        console.warn('[fetchPhotos] Failed to load document_attachments:', e)
      }

      // Merge collected photos into reports
      // Merge collected photos into reports
      reports.forEach((report: any) => {
        const sideLoaded = photoMap.get(report.id)

        // Base photos from array columns
        let beforeRaw = report.additional_before_photos || []
        let afterRaw = report.additional_after_photos || []

        // Convert base to objects
        let beforeObjs = beforeRaw.map((u: any) => ({
          url: typeof u === 'string' ? u : u?.url || u,
          source: 'daily_report',
        }))
        let afterObjs = afterRaw.map((u: any) => ({
          url: typeof u === 'string' ? u : u?.url || u,
          source: 'daily_report',
        }))
        let ingObjs: any[] = []

        if (sideLoaded) {
          // Merge side-loaded
          // Uniqueness by URL
          const seenBefore = new Set(beforeObjs.map((o: any) => o.url))
          sideLoaded.before.forEach(item => {
            if (!seenBefore.has(item.url)) {
              beforeObjs.push(item)
              seenBefore.add(item.url)
            }
          })

          const seenAfter = new Set(afterObjs.map((o: any) => o.url))
          sideLoaded.after.forEach(item => {
            if (!seenAfter.has(item.url)) {
              afterObjs.push(item)
              seenAfter.add(item.url)
            }
          })

          const seenIng = new Set()
          sideLoaded.ing.forEach(item => {
            if (!seenIng.has(item.url)) {
              ingObjs.push(item)
              seenIng.add(item.url)
            }
          })
        }

        report._beforePhotos = beforeObjs
        report._afterPhotos = afterObjs
        report._ingPhotos = ingObjs
      })

      console.log('[fetchPhotos] First report sample:', JSON.stringify(reports[0], null, 2))
    }
  }

  const results = (reports || [])
    .map((report: any) => {
      // Prioritize _beforePhotos / _afterPhotos (Obj[])
      // If missing, fallback to legacy processing (String[])
      let beforeCtx = report._beforePhotos || []
      let afterCtx = report._afterPhotos || []

      // Legacy fallback (just in case, though unlikely given new flow)
      if (beforeCtx.length === 0 && report.additional_before_photos) {
        beforeCtx = normalizeAfterPhotoUrls(report, 'additional_before_photos').map(u => ({
          url: u,
          source: 'daily_report',
        }))
      }
      if (afterCtx.length === 0 && report.additional_after_photos) {
        afterCtx = normalizeAfterPhotoUrls(report, 'additional_after_photos').map(u => ({
          url: u,
          source: 'daily_report',
        }))
      }

      // if (beforeCtx.length === 0 && afterCtx.length === 0) return null // REMOVED FILTER: Allow empty for upload

      const photoItems: PhotoItem[] = []

      // Map Before Photos
      beforeCtx.forEach((item: any, idx: number) => {
        photoItems.push({
          id: item.ref || `${String(report.id)}-before-${idx}`,
          url: item.url,
          type: 'before',
          caption: '시공 전',
          date: report.work_date,
          source: item.source,
          ref: item.ref,
          reportId: String(report.id),
        })
      })

      // Map After Photos
      afterCtx.forEach((item: any, idx: number) => {
        photoItems.push({
          id: item.ref || `${String(report.id)}-after-${idx}`,
          url: item.url,
          type: 'after',
          caption: '시공 후',
          date: report.work_date,
          source: item.source,
          ref: item.ref,
          reportId: String(report.id),
        })
      })

      const site = Array.isArray(report.sites) ? report.sites[0] : report.sites

      return {
        id: String(report.id),
        title: site?.name || '현장',
        contractor: '협력사',
        affiliation: '협력업체',
        author: report.profiles?.full_name || report.member_name || '작성자',
        date: report.work_date,
        time: report.created_at
          ? new Date(report.created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : undefined,
        status:
          report.status === 'approved'
            ? 'approved'
            : report.status === 'returned' || report.status === 'rejected'
              ? 'rejected'
              : 'submitted',
        desc: (() => {
          const parts: string[] = []

          // 1. Calculate Description (Work Content) - Prioritize Flat DB Columns
          // A. Prefer Flat Columns (Most Robust & Maintainable)
          // 1. Component
          const cName =
            report.component_name ||
            report.componentName ||
            report.component_type ||
            report.componentType ||
            report.member_name
          if (cName && String(cName).trim()) parts.push(String(cName).trim())

          // 2. Process Type / Work Process
          const pType =
            report.work_process || report.workProcess || report.process_type || report.processType
          if (pType && String(pType).trim()) parts.push(String(pType).trim())

          // 3. Work Section / Location
          const wSection = report.work_section || report.workSection
          if (wSection && String(wSection).trim()) parts.push(String(wSection).trim())

          // B. Fallback to work_content JSON ONLY if flat fields are empty
          if (parts.length === 0) {
            const parsedWorkContent = (() => {
              const raw = report.work_content
              if (!raw) return null
              if (typeof raw === 'object') return raw
              if (typeof raw === 'string') {
                const trimmed = raw.trim()
                if (!trimmed) return null
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                  try {
                    return JSON.parse(trimmed)
                  } catch {
                    return null
                  }
                }
              }
              return null
            })()

            if (
              parsedWorkContent &&
              typeof parsedWorkContent === 'object' &&
              Array.isArray((parsedWorkContent as any).tasks)
            ) {
              ;((parsedWorkContent as any).tasks || []).forEach((t: any) => {
                if (t.component_type) parts.push(String(t.component_type))
                if (t.content || t.process_type) parts.push(String(t.content || t.process_type))
                if (t.location || t.work_section) parts.push(String(t.location || t.work_section))
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
        })(),
        photos: photoItems,
      }
    })
    .filter(Boolean) as PhotoGroup[]

  if (results.length === 0) {
    const IMG_CONCRETE =
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2000&auto=format&fit=crop'
    const IMG_WALL =
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop'

    return [
      {
        id: 'mock_ph1',
        title: '송파 B현장 (예시 데이터)',
        contractor: 'GS건설',
        affiliation: '협력업체',
        author: '이시공',
        date: '2025-12-09',
        time: '16:45',
        status: 'done',
        desc: '슬라브/면/지하',
        photos: [
          {
            id: 'ph1-1',
            url: IMG_CONCRETE,
            type: 'after',
            caption: '배관 설치 완료',
            date: '2025-12-09',
          },
          {
            id: 'ph1-2',
            url: IMG_WALL,
            type: 'before',
            caption: '설치 전',
            date: '2025-12-09',
          },
        ],
      },
      {
        id: 'mock_ph2',
        title: '판교 IT센터 (예시 데이터)',
        contractor: '대림산업',
        affiliation: 'HQ',
        author: '김전기',
        date: '2025-12-10',
        time: '09:30',
        status: 'pending',
        desc: '전기 배선 작업',
        photos: [
          {
            id: 'ph2-1',
            url: IMG_WALL,
            type: 'ing',
            caption: '작업 중',
            date: '2025-12-10',
          },
        ],
      },
    ]
  }

  return results
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
  const originalName = formData.get('originalName') as string | undefined

  if (!file || !requirementId) {
    return { success: false, error: 'Missing file or requirementId' }
  }

  try {
    // 1. Upload to Storage
    // We use userId as siteId for personal docs, and 'other' as generic type
    const { uploadSiteDocument } = await import('@/lib/supabase/storage')
    // Use originalName if provided, for robust encoding handling
    const { publicUrl, fileName } = await uploadSiteDocument(file, userId, 'other', originalName)

    // 2. Upsert Submission Record
    // Use service role to bypass RLS for the insert/update
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabase = createServiceRoleClient()
    const timestamp = new Date().toISOString()

    // Sanitize filename for DB to avoid length/encoding issues
    // normalized for consistent storage (NFC is standard for web) - already normalized by uploadSiteDocument but just in case
    const dbFileName = fileName.substring(0, 100)

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
        file_name: fileName.normalize('NFC'),
        site_id: siteId,
        category_type: 'shared',
        sub_category:
          docType === 'blueprint'
            ? 'blueprint'
            : docType === 'completion'
              ? 'completion_drawing'
              : 'progress_drawing',
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

export async function getMarkupDataAction(docId: string) {
  const supabase = await createClient()

  // Try fetching from markup_documents first
  const { data: markupDoc, error: markupError } = await supabase
    .from('markup_documents')
    .select('markup_data')
    .eq('id', docId)
    .single()

  if (!markupError && markupDoc) {
    return { success: true, markupData: markupDoc.markup_data }
  }

  // Fallback: Check unified_documents or documents if needed?
  // But editor saves to markup_documents.
  // If it's a new drawing (not yet saved as markup_doc), it might not exist there.
  // But if user says "Existing marked drawing", it MUST be in markup_documents.

  if (markupError) {
    console.error('Error fetching markup data:', markupError)
  }

  return { success: false, error: markupError?.message || 'Not found' }
}

export async function deletePhotoAction(
  reportId: string,
  photoUrl: string,
  type: string,
  source?: string, // 'daily_report' | 'add_photo' | 'doc_attach'
  ref?: string // ID for table rows
) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return { success: false, error: 'Unauthorized' }
  const supabase = createServiceRoleClient()

  try {
    if (source === 'add_photo' && ref) {
      const { error } = await supabase.from('daily_report_additional_photos').delete().eq('id', ref)
      if (error) throw error
    } else if (source === 'doc_attach' && ref) {
      const { error } = await supabase.from('document_attachments').delete().eq('id', ref)
      if (error) throw error
    } else {
      // Default / daily_report source: Remove from array in daily_reports
      const col = type === 'before' ? 'additional_before_photos' : 'additional_after_photos'

      const { data: report, error: fetchError } = await supabase
        .from('daily_reports')
        .select(col)
        .eq('id', reportId)
        .single()

      if (fetchError) throw fetchError

      const currentList: string[] = report?.[col] || []
      const newList = currentList.filter(u => u !== photoUrl) // Simple string match

      if (newList.length !== currentList.length) {
        const { error: updateError } = await supabase
          .from('daily_reports')
          .update({ [col]: newList })
          .eq('id', reportId)
        if (updateError) throw updateError
      }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')
    return { success: true }
  } catch (err: any) {
    console.error('deletePhotoAction error:', err)
    return { success: false, error: err.message }
  }
}

export async function movePhotoAction(
  reportId: string,
  photoUrl: string,
  currentType: string,
  targetType: string,
  source?: string,
  ref?: string
) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return { success: false, error: 'Unauthorized' }
  const supabase = createServiceRoleClient()

  try {
    // 1. Calculate next order for targetType
    const { data: maxOrder } = await supabase
      .from('daily_report_additional_photos')
      .select('upload_order')
      .eq('daily_report_id', reportId)
      .eq('photo_type', targetType)
      .order('upload_order', { ascending: false })
      .limit(1)

    const nextOrder = (maxOrder && maxOrder[0]?.upload_order ? maxOrder[0].upload_order : 0) + 1

    if (source === 'add_photo' && ref) {
      // 2a. Source is already normalized: Update type and order
      const { error } = await supabase
        .from('daily_report_additional_photos')
        .update({
          photo_type: targetType,
          upload_order: nextOrder,
        })
        .eq('id', ref)
      if (error) throw error
    } else {
      // 2b. Source is external (Array or DocAttach): Migrate to normalized table

      // Step A: Insert into normalized table
      const { error: insertError } = await supabase.from('daily_report_additional_photos').insert({
        daily_report_id: reportId,
        photo_type: targetType,
        file_url: photoUrl,
        upload_order: nextOrder,
      })
      if (insertError) throw insertError

      // Step B: Remove from source
      if (source === 'doc_attach' && ref) {
        await supabase.from('document_attachments').delete().eq('id', ref)
      } else {
        // daily_report array
        // Only 'before' and 'after' interact with arrays. 'ing' is never in array.
        // Identify source column based on currentType
        const sourceCol =
          currentType === 'before'
            ? 'additional_before_photos'
            : currentType === 'after'
              ? 'additional_after_photos'
              : null

        if (sourceCol) {
          const { data: report, error: fetchError } = await supabase
            .from('daily_reports')
            .select(sourceCol)
            .eq('id', reportId)
            .single()

          if (!fetchError && report) {
            const currentList: string[] = report?.[sourceCol] || []
            const newList = currentList.filter(u => u !== photoUrl)

            if (newList.length !== currentList.length) {
              await supabase
                .from('daily_reports')
                .update({ [sourceCol]: newList })
                .eq('id', reportId)
            }
          }
        }
      }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')
    return { success: true }
  } catch (err: any) {
    console.error('movePhotoAction error:', err)
    return { success: false, error: err.message }
  }
}

export async function uploadPhotoAction(formData: FormData) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return { success: false, error: 'Unauthorized' }
  }
  const userId = auth.userId

  const file = formData.get('file') as File
  const reportId = formData.get('reportId') as string
  const photoType = formData.get('photoType') as string
  const originalName = formData.get('originalName') as string

  if (!file || !reportId || !photoType) {
    return { success: false, error: 'Missing file, reportId, or photoType' }
  }

  const supabase = createServiceRoleClient()

  try {
    // 0. Get Site ID from report to organize storage (optional but good practice)
    const { data: report } = await supabase
      .from('daily_reports')
      .select('site_id')
      .eq('id', reportId)
      .single()
    const siteId = report?.site_id || 'unknown'

    // 1. Upload to Storage
    console.log('[uploadPhotoAction] Starting upload for siteId:', siteId, 'reportId:', reportId)
    const { uploadSiteDocument } = await import('@/lib/supabase/storage')
    const { publicUrl, fileName, path } = await uploadSiteDocument(
      file,
      siteId,
      'other',
      originalName
    )
    console.log('[uploadPhotoAction] Upload successful, publicUrl:', publicUrl)

    // 2. Calculate next order
    const { data: maxOrder } = await supabase
      .from('daily_report_additional_photos')
      .select('upload_order')
      .eq('daily_report_id', reportId)
      .eq('photo_type', photoType)
      .order('upload_order', { ascending: false })
      .limit(1)

    const nextOrder = (maxOrder && maxOrder[0]?.upload_order ? maxOrder[0].upload_order : 0) + 1

    // 3. Insert into daily_report_additional_photos
    const { error } = await supabase.from('daily_report_additional_photos').insert({
      daily_report_id: reportId,
      photo_type: photoType,
      file_url: publicUrl,
      file_path: path,
      file_name: originalName,
      file_size: file.size,
      description: '',
      upload_order: nextOrder,
      uploaded_by: userId,
    })

    if (error) throw error

    // 4. Revalidate
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/documents/hub')

    return { success: true }
  } catch (err: any) {
    console.error('uploadPhotoAction error:', err)
    return { success: false, error: err.message || 'Upload failed' }
  }
}

export async function fetchAllSites() {
  const supabase = createServiceRoleClient()
  try {
    // Filter out deleted sites (is_deleted must be false or null)
    // Using .neq('is_deleted', true) is safer if nulls exist, but .eq('is_deleted', false) is standard if default is false.
    // Based on admin adapter, it uses .eq('is_deleted', false).
    const { data, error } = await supabase
      .from('sites')
      .select('id, name')
      .eq('is_deleted', false)
      .order('name')
    if (error) {
      console.error('fetchAllSites error:', error)
      return []
    }
    return (data || []).map(s => ({ id: String(s.id), name: s.name }))
  } catch (err) {
    console.error('fetchAllSites exception:', err)
    return []
  }
}
