import { Buffer } from 'node:buffer'
import { createServiceClient } from '@/lib/supabase/service'
import type { AdditionalPhotoData } from '@/types/daily-reports'

export type SiteRow = {
  id: string
  organization_id?: string | null
}

export type DailyReportRow = {
  id: string
  site_id: string
  work_date?: string | null
  process_type?: string | null
  component_name?: string | null
  member_name?: string | null
  work_section?: string | null
}

export type ProfileRow = {
  id: string
  full_name?: string | null
  role?: string | null
}

export type RawPhotoRow = {
  id: string
  daily_report_id: string
  photo_type: 'before' | 'after'
  file_url: string
  file_path: string
  file_name: string
  file_size: number
  description?: string | null
  upload_order: number
  uploaded_by?: string | null
  created_at?: string | null
  daily_reports?: DailyReportRow | null
  daily_report?: DailyReportRow | null
  report?: DailyReportRow | null
  uploader?: ProfileRow | null
  profiles?: ProfileRow | null
}

export function mapPhotoRow(
  row: RawPhotoRow,
  fallbackReport?: DailyReportRow | null
): AdditionalPhotoData {
  const report = row.daily_reports || row.daily_report || row.report || fallbackReport || undefined
  const uploader = row.uploader || row.profiles || null
  const adminUploaded = uploader?.role
    ? ['admin', 'system_admin'].includes(String(uploader.role))
    : false

  return {
    id: row.id,
    daily_report_id: row.daily_report_id,
    photo_type: row.photo_type,
    filename: row.file_name,
    url: row.file_url,
    path: row.file_path,
    storage_path: row.file_path,
    file_size: row.file_size,
    description: row.description || undefined,
    upload_order: row.upload_order,
    uploaded_by: row.uploaded_by || undefined,
    uploaded_at: row.created_at || undefined,
    site_id: report?.site_id || undefined,
    work_date: report?.work_date || undefined,
    process_type: report?.process_type || undefined,
    component_name: report?.component_name || undefined,
    member_name: report?.member_name || undefined,
    uploaded_by_name: uploader?.full_name || undefined,
    admin_uploaded: adminUploaded,
  }
}

export async function fetchSiteRecord(siteId: string): Promise<SiteRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('sites')
    .select('id, organization_id')
    .eq('id', siteId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message || 'Failed to verify site')
  }
  return (data || null) as SiteRow | null
}

export async function fetchDailyReportsMeta(
  reportIds: string[]
): Promise<Record<string, DailyReportRow>> {
  if (reportIds.length === 0) return {}
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('daily_reports')
    .select('id, site_id, work_date, process_type, component_name, member_name, work_section')
    .in('id', reportIds)
  if (error) {
    throw new Error(error.message || 'Failed to load daily reports metadata')
  }
  const map: Record<string, DailyReportRow> = {}
  for (const row of data || []) {
    if (!row?.id) continue
    map[row.id] = {
      id: row.id,
      site_id: row.site_id,
      work_date: row.work_date,
      process_type: row.process_type,
      component_name: row.component_name,
      member_name: row.member_name,
      work_section: row.work_section,
    }
  }
  return map
}

export async function ensureReportBelongsToSite(reportId: string, siteId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('daily_reports')
    .select('id, site_id')
    .eq('id', reportId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message || 'Failed to verify daily report')
  }
  if (!data) {
    return { exists: false, matches: false }
  }
  return { exists: true, matches: data.site_id === siteId }
}

export async function listPhotosWithJoin(options: {
  siteId: string
  type?: 'before' | 'after'
  uploaderId?: string
  reportId?: string
  startDate?: string
  endDate?: string
  processType?: string
  query?: string
  limit: number
  offset: number
}) {
  const supabase = createServiceClient()
  let query = supabase
    .from('daily_report_additional_photos')
    .select(
      `
        id,
        daily_report_id,
        photo_type,
        file_url,
        file_path,
        file_name,
        file_size,
        description,
        upload_order,
        uploaded_by,
        created_at,
        daily_reports!inner (
          id,
          site_id,
          work_date,
          process_type,
          component_name,
          member_name,
          work_section
        ),
        uploader:profiles!daily_report_additional_photos_uploaded_by_fkey (
          id,
          full_name,
          role
        )
      `,
      { count: 'exact' }
    )
    .eq('daily_reports.site_id', options.siteId)

  if (options.reportId) {
    query = query.eq('daily_report_id', options.reportId)
  }
  if (options.type) {
    query = query.eq('photo_type', options.type)
  }
  if (options.uploaderId) {
    query = query.eq('uploaded_by', options.uploaderId)
  }
  if (options.startDate) {
    query = query.gte('daily_reports.work_date', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('daily_reports.work_date', options.endDate)
  }
  if (options.processType) {
    query = query.eq('daily_reports.process_type', options.processType)
  }
  if (options.query) {
    const pattern = `%${options.query}%`
    query = query.or(`file_name.ilike.${pattern},description.ilike.${pattern}`)
  }

  query = query
    .order('created_at', { ascending: false })
    .order('upload_order', { ascending: false })
    .range(options.offset, options.offset + options.limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  const rows = (data || []) as RawPhotoRow[]
  const mapped = rows.map(row => mapPhotoRow(row))
  return { rows: mapped, count: count ?? mapped.length }
}

export async function getNextUploadOrder(reportId: string, type: 'before' | 'after') {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('daily_report_additional_photos')
    .select('upload_order')
    .eq('daily_report_id', reportId)
    .eq('photo_type', type)
    .order('upload_order', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message || 'Failed to fetch upload order')
  }

  if (!data || data.length === 0 || typeof data[0]?.upload_order !== 'number') {
    return 1
  }

  return data[0].upload_order + 1
}

export async function resequenceUploadOrder(reportId: string, type: 'before' | 'after') {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('daily_report_additional_photos')
    .select('id, upload_order')
    .eq('daily_report_id', reportId)
    .eq('photo_type', type)
    .order('upload_order', { ascending: true })

  if (error) {
    console.warn('[site-photos] resequence query failed:', error)
    return
  }

  const rows = data || []
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const desiredOrder = index + 1
    if (row.upload_order === desiredOrder) continue
    await supabase
      .from('daily_report_additional_photos')
      .update({ upload_order: desiredOrder })
      .eq('id', row.id)
  }
}

export async function aggregateAdditionalPhotos(reportId: string) {
  const supabase = createServiceClient()
  try {
    const { data, error } = await supabase
      .from('daily_report_additional_photos')
      .select(
        'photo_type, file_url, file_path, file_name, description, upload_order, uploaded_by, created_at'
      )
      .eq('daily_report_id', reportId)
      .order('upload_order', { ascending: true })

    if (error) return

    const before: Array<Record<string, unknown>> = []
    const after: Array<Record<string, unknown>> = []
    for (const row of data || []) {
      const entry: Record<string, unknown> = {
        url: row.file_url,
        path: row.file_path || undefined,
        storage_path: row.file_path || undefined,
        filename: row.file_name || undefined,
        description: row.description || undefined,
        upload_order: row.upload_order || 0,
        order: row.upload_order || 0,
        uploaded_by: row.uploaded_by || undefined,
        uploaded_at: row.created_at || undefined,
        photo_type: row.photo_type,
      }
      if (row.photo_type === 'before') before.push(entry)
      else if (row.photo_type === 'after') after.push(entry)
    }

    await supabase
      .from('daily_reports')
      .update({
        additional_before_photos: before,
        additional_after_photos: after,
      })
      .eq('id', reportId)
  } catch (error) {
    console.warn('[site-photos] aggregateAdditionalPhotos warning:', error)
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function buildStoragePath(reportId: string, type: 'before' | 'after', originalName: string) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const sanitized = sanitizeFileName(originalName)
  return `daily-reports/${reportId}/additional/${type}/${timestamp}_${random}_${sanitized}`
}

export async function uploadPhotoToStorage(reportId: string, type: 'before' | 'after', file: File) {
  const path = buildStoragePath(reportId, type, file.name)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const service = createServiceClient()
  const { error } = await service.storage.from('daily-reports').upload(path, buffer, {
    upsert: false,
    duplex: 'half',
    contentType: file.type || 'image/jpeg',
  })

  if (error) {
    throw new Error(error.message || '파일 업로드에 실패했습니다.')
  }

  const {
    data: { publicUrl },
  } = service.storage.from('daily-reports').getPublicUrl(path)

  return { path, publicUrl }
}

type PostgrestErrorLike = {
  code?: string
  message?: string
}

export function isMissingAdditionalPhotosTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const maybe = error as PostgrestErrorLike
  return maybe.code === '42P01'
}

type StorageErrorLike = {
  message?: string
  error?: string
}

export function isStorageBucketMissingError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const maybe = error as StorageErrorLike
  const message = maybe.message || maybe.error
  if (!message) return false
  return message.includes('Bucket not found') || message.includes('bucket does not exist')
}

export type AdditionalPhotosTableStatus =
  | { ready: true }
  | { ready: false; reason: 'missing'; message?: string }

export async function getAdditionalPhotosTableStatus(): Promise<AdditionalPhotosTableStatus> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('daily_report_additional_photos').select('id').limit(1)
  if (!error) {
    return { ready: true }
  }

  if (isMissingAdditionalPhotosTableError(error)) {
    return {
      ready: false,
      reason: 'missing',
      message: error.message,
    }
  }

  throw new Error(error.message || 'Failed to verify additional photos table')
}

type PhotoWithPath = {
  url?: string | null
  path?: string | null
  storage_path?: string | null
}

export async function withSignedPhotoUrls<T extends PhotoWithPath>(
  photos: T[],
  expiresInSeconds = 60 * 60
): Promise<T[]> {
  const paths = Array.from(
    new Set(
      photos
        .map(photo => photo.storage_path || photo.path)
        .filter((value): value is string => Boolean(value))
    )
  )

  if (paths.length === 0) return photos

  const service = createServiceClient()
  const { data, error } = await service.storage
    .from('daily-reports')
    .createSignedUrls(paths, expiresInSeconds)

  if (error || !data) {
    console.warn('[site-photos] failed to create signed urls:', error)
    return photos
  }

  const urlMap = new Map<string, string>()
  for (const item of data) {
    if (item?.path && item?.signedUrl) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return photos.map(photo => {
    const path = photo.storage_path || photo.path
    if (!path) return photo
    const signed = urlMap.get(path)
    if (!signed) return photo
    return { ...photo, url: signed }
  })
}

export async function fetchAdditionalPhotosForReport(reportId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('daily_report_additional_photos')
    .select(
      `
        id,
        daily_report_id,
        photo_type,
        file_url,
        file_path,
        file_name,
        file_size,
        description,
        upload_order,
        uploaded_by,
        created_at,
        uploader:profiles!daily_report_additional_photos_uploaded_by_fkey (
          id,
          full_name,
          role
        )
      `
    )
    .eq('daily_report_id', reportId)
    .order('photo_type', { ascending: true })
    .order('upload_order', { ascending: true })

  if (error) {
    console.error('[site-photos] fetchAdditionalPhotosForReport error:', error)
    return { before: [], after: [] }
  }

  const mapped = (data || []).map(row => mapPhotoRow(row as RawPhotoRow))
  const signed = await withSignedPhotoUrls(mapped)

  return {
    additional_before_photos: signed.filter(photo => photo.photo_type === 'before'),
    additional_after_photos: signed.filter(photo => photo.photo_type === 'after'),
  }
}
