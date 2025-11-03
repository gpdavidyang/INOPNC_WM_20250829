import { Buffer } from 'node:buffer'
import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import {
  aggregateAdditionalPhotos,
  buildStoragePath,
  ensureReportBelongsToSite,
  fetchDailyReportsMeta,
  fetchSiteRecord,
  getAdditionalPhotosTableStatus,
  getNextUploadOrder,
  isMissingAdditionalPhotosTableError,
  isStorageBucketMissingError,
  listPhotosWithJoin,
  mapPhotoRow,
  resequenceUploadOrder,
} from '@/lib/admin/site-photos'
import type { ProfileRow, RawPhotoRow } from '@/lib/admin/site-photos'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_PAGE_SIZE = 200

function buildErrorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin'].includes(String(auth.role))) {
      return buildErrorResponse('Forbidden', 403)
    }

    const siteId = context.params.id
    if (!siteId) return buildErrorResponse('siteId is required')

    const site = await fetchSiteRecord(siteId)
    if (!site) {
      return buildErrorResponse('Site not found', 404)
    }

    if (auth.isRestricted && site.organization_id && auth.restrictedOrgId) {
      if (site.organization_id !== auth.restrictedOrgId) {
        return buildErrorResponse('Forbidden', 403)
      }
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.parseInt(searchParams.get('limit') || '60', 10))
    )
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10))
    const offset = (page - 1) * limit
    const typeParam = searchParams.get('type')
    const uploaderParam = searchParams.get('uploaded_by')
    const reportParam = searchParams.get('report_id')
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined
    const processType = searchParams.get('process_type') || undefined
    const query = (searchParams.get('q') || '').trim() || undefined

    const tableStatus = await getAdditionalPhotosTableStatus()
    if (!tableStatus.ready) {
      return NextResponse.json({
        success: true,
        data: { items: [], counts: { before: 0, after: 0 } },
        pagination: { page, limit, total: 0, totalPages: 0 },
        warning: tableStatus.message || '사진 저장 테이블이 준비되지 않았습니다.',
      })
    }

    let type: 'before' | 'after' | undefined
    if (typeParam === 'before' || typeParam === 'after') {
      type = typeParam
    }

    if (reportParam) {
      const reportCheck = await ensureReportBelongsToSite(reportParam, siteId)
      if (!reportCheck.exists) {
        return buildErrorResponse('Daily report not found', 404)
      }
      if (!reportCheck.matches) {
        return buildErrorResponse('Report does not belong to site', 403)
      }
    }

    let rows: AdditionalPhotoData[] = []
    let total = 0

    try {
      const result = await listPhotosWithJoin({
        siteId,
        type,
        uploaderId: uploaderParam || undefined,
        reportId: reportParam || undefined,
        startDate,
        endDate,
        processType,
        query,
        limit,
        offset,
      })
      rows = result.rows
      total = result.count
    } catch (error) {
      console.warn('[admin/sites/photos] primary query failed, fallback enabled:', error)

      const supabase = createServiceClient()
      let reportQuery = supabase.from('daily_reports').select('id').eq('site_id', siteId)

      if (startDate) {
        reportQuery = reportQuery.gte('work_date', startDate)
      }
      if (endDate) {
        reportQuery = reportQuery.lte('work_date', endDate)
      }
      if (processType) {
        reportQuery = reportQuery.eq('process_type', processType)
      }
      if (reportParam) {
        reportQuery = reportQuery.eq('id', reportParam)
      }

      const { data: reportRows, error: reportError } = await reportQuery
      if (reportError) {
        console.error('[admin/sites/photos] fallback report query error:', reportError)
        return buildErrorResponse('Failed to load daily reports', 500)
      }

      const reportIds = (reportRows || []).map(row => row.id).filter(Boolean)
      if (reportParam && reportIds.length === 0) {
        return buildErrorResponse('Daily report not found', 404)
      }
      if (reportIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: { items: [], counts: { before: 0, after: 0 } },
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }

      let photoQuery = supabase
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
            created_at
          `,
          { count: 'exact' }
        )
        .in('daily_report_id', reportIds)

      if (type) {
        photoQuery = photoQuery.eq('photo_type', type)
      }
      if (uploaderParam) {
        photoQuery = photoQuery.eq('uploaded_by', uploaderParam)
      }
      if (query) {
        const pattern = `%${query}%`
        photoQuery = photoQuery.or(`file_name.ilike.${pattern},description.ilike.${pattern}`)
      }

      const {
        data: photoRows,
        count,
        error: photoError,
      } = await photoQuery
        .order('created_at', { ascending: false })
        .order('upload_order', { ascending: false })
        .range(offset, offset + limit - 1)

      if (photoError) {
        console.error('[admin/sites/photos] fallback photo query error:', photoError)
        return buildErrorResponse('Failed to load photos', 500)
      }

      const uploaderIds = Array.from(
        new Set((photoRows || []).map(row => row.uploaded_by).filter(Boolean))
      ) as string[]
      const reportMeta = await fetchDailyReportsMeta(
        Array.from(new Set((photoRows || []).map(row => row.daily_report_id).filter(Boolean)))
      )

      let uploaderMap: Record<string, ProfileRow> = {}
      if (uploaderIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', uploaderIds)
        if (!profileError && profiles) {
          uploaderMap = Object.fromEntries(
            profiles.map(profile => [profile.id, profile as ProfileRow])
          )
        }
      }

      rows = (photoRows || []).map(row =>
        mapPhotoRow(
          {
            ...row,
            uploader: uploaderMap[row.uploaded_by || ''] || null,
          } as RawPhotoRow,
          reportMeta[row.daily_report_id]
        )
      )
      total = count ?? rows.length
    }

    const beforeCount = rows.filter(row => row.photo_type === 'before').length
    const afterCount = rows.filter(row => row.photo_type === 'after').length
    const totalPages = Math.max(1, Math.ceil((total || 0) / limit))

    return NextResponse.json({
      success: true,
      data: {
        items: rows,
        counts: {
          before: beforeCount,
          after: afterCount,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('[admin/sites/photos][GET] unexpected error:', error)
    if (isMissingAdditionalPhotosTableError(error)) {
      return NextResponse.json({
        success: true,
        data: { items: [], counts: { before: 0, after: 0 } },
        pagination: { page, limit, total: 0, totalPages: 0 },
        warning: '사진 저장 테이블이 준비되지 않았습니다.',
      })
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return buildErrorResponse(message, 500)
  }
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin'].includes(String(auth.role))) {
      return buildErrorResponse('Forbidden', 403)
    }

    const siteId = context.params.id
    const form = await request.formData()
    const file = form.get('file') as File | null
    const typeParam = String(form.get('photo_type') || '').toLowerCase()
    const description = (form.get('description') || '').toString()
    const reportId = String(form.get('daily_report_id') || '')

    if (!file) return buildErrorResponse('file is required')
    if (!reportId) return buildErrorResponse('daily_report_id is required')
    if (typeParam !== 'before' && typeParam !== 'after') {
      return buildErrorResponse('photo_type must be "before" or "after"')
    }

    const site = await fetchSiteRecord(siteId)
    if (!site) return buildErrorResponse('Site not found', 404)

    const reportCheck = await ensureReportBelongsToSite(reportId, siteId)
    if (!reportCheck.exists) return buildErrorResponse('Daily report not found', 404)
    if (!reportCheck.matches) return buildErrorResponse('Report does not belong to site', 403)

    const tableStatus = await getAdditionalPhotosTableStatus()
    if (!tableStatus.ready) {
      return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
    }

    if (file.size > 10 * 1024 * 1024) {
      return buildErrorResponse('파일 크기가 10MB를 초과했습니다.')
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      return buildErrorResponse('지원하지 않는 파일 형식입니다.')
    }

    const uploadOrder = await getNextUploadOrder(reportId, typeParam as 'before' | 'after')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const storagePath = buildStoragePath(reportId, typeParam as 'before' | 'after', file.name)

    const service = createServiceClient()
    const { error: uploadError } = await service.storage
      .from('daily-reports')
      .upload(storagePath, buffer, {
        upsert: false,
        duplex: 'half',
        contentType: file.type || 'image/jpeg',
      })
    if (uploadError) {
      console.error('[admin/sites/photos][POST] storage upload error:', uploadError)
      if (isStorageBucketMissingError(uploadError)) {
        return buildErrorResponse(
          'daily-reports 스토리지 버킷이 없습니다. Supabase Storage에 "daily-reports" 버킷을 생성해 주세요.',
          503
        )
      }
      return buildErrorResponse(uploadError.message || '파일 업로드에 실패했습니다.', 500)
    }

    const {
      data: { publicUrl },
    } = service.storage.from('daily-reports').getPublicUrl(storagePath)

    const { data: inserted, error: insertError } = await service
      .from('daily_report_additional_photos')
      .insert({
        daily_report_id: reportId,
        photo_type: typeParam,
        file_url: publicUrl,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        description: description || null,
        upload_order: uploadOrder,
        uploaded_by: auth.userId,
      })
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
          daily_reports (
            id,
            site_id,
            work_date,
            process_type,
            component_name,
            member_name,
            work_section
          ),
          uploader:profiles (
            id,
            full_name,
            role
          )
        `
      )
      .single()

    if (insertError || !inserted) {
      console.error('[admin/sites/photos][POST] insert error:', insertError)
      await service.storage.from('daily-reports').remove([storagePath])
      if (insertError && isMissingAdditionalPhotosTableError(insertError)) {
        return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
      }
      return buildErrorResponse(insertError?.message || '사진 저장에 실패했습니다.', 500)
    }

    await aggregateAdditionalPhotos(reportId)

    const photo = mapPhotoRow(inserted as RawPhotoRow)

    return NextResponse.json({
      success: true,
      data: photo,
    })
  } catch (error) {
    console.error('[admin/sites/photos][POST] unexpected error:', error)
    if (isMissingAdditionalPhotosTableError(error)) {
      return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return buildErrorResponse(message, 500)
  }
}
