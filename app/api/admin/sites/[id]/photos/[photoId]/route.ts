import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import {
  aggregateAdditionalPhotos,
  buildStoragePath,
  deriveVariantPathsFromStoredPath,
  fetchSiteRecord,
  getAdditionalPhotosTableStatus,
  getNextUploadOrder,
  isMissingAdditionalPhotosTableError,
  mapPhotoRow,
  resequenceUploadOrder,
  withSignedPhotoUrls,
} from '@/lib/admin/site-photos'
import type { RawPhotoRow } from '@/lib/admin/site-photos'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function buildErrorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function fetchPhoto(photoId: string): Promise<RawPhotoRow | null> {
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
    .eq('id', photoId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Failed to load photo')
  }

  return (data as RawPhotoRow | null) || null
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string; photoId: string } }
) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin'].includes(String(auth.role))) {
      return buildErrorResponse('Forbidden', 403)
    }

    const siteId = context.params.id
    const photoId = context.params.photoId

    const site = await fetchSiteRecord(siteId)
    if (!site) return buildErrorResponse('Site not found', 404)

    const tableStatus = await getAdditionalPhotosTableStatus()
    if (!tableStatus.ready) {
      return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
    }

    const photoRow = await fetchPhoto(photoId)
    if (!photoRow) return buildErrorResponse('Photo not found', 404)
    const report = photoRow.daily_reports || photoRow.daily_report || photoRow.report
    if (!report || report.site_id !== siteId) {
      return buildErrorResponse('Photo does not belong to this site', 403)
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return buildErrorResponse('Invalid payload')
    }

    const nextTypeRaw = payload.photo_type
    const nextDescription =
      typeof payload.description === 'string' ? payload.description.trim() : undefined

    let shouldUpdate = false
    const updates: Record<string, unknown> = {}
    let moved = false
    let targetType: 'before' | 'after' = photoRow.photo_type

    if (typeof nextTypeRaw === 'string') {
      const normalized = nextTypeRaw.toLowerCase()
      if (normalized !== 'before' && normalized !== 'after') {
        return buildErrorResponse('photo_type must be "before" or "after"')
      }
      if (normalized !== photoRow.photo_type) {
        targetType = normalized
        shouldUpdate = true
        moved = true
      }
    }

    if (typeof nextDescription !== 'undefined' && nextDescription !== photoRow.description) {
      updates.description = nextDescription
      shouldUpdate = true
    }

    if (!shouldUpdate) {
      return buildErrorResponse('No changes requested', 400)
    }

    const service = createServiceClient()
    let newPath = photoRow.file_path
    let newUrl = photoRow.file_url
    let newOrder = photoRow.upload_order

    if (moved) {
      const oldType = photoRow.photo_type
      const segments = photoRow.file_path.split('/')
      const typeIndex = segments.findIndex(segment => segment === 'before' || segment === 'after')
      if (typeIndex >= 0) {
        segments[typeIndex] = targetType
        newPath = segments.join('/')
      } else {
        newPath = buildStoragePath(photoRow.daily_report_id, targetType, photoRow.file_name)
      }

      const { error: moveError } = await service.storage
        .from('daily-reports')
        .move(photoRow.file_path, newPath)

      if (moveError) {
        console.error('[admin/sites/photos][PATCH] move error:', moveError)
        return buildErrorResponse(moveError.message || '파일 이동에 실패했습니다.', 500)
      }

      const {
        data: { publicUrl },
      } = service.storage.from('daily-reports').getPublicUrl(newPath)

      newUrl = publicUrl
      newOrder = await resequenceAndGetOrderOnMove(photoRow.daily_report_id, oldType, targetType)
      updates.photo_type = targetType
      updates.file_path = newPath
      updates.file_url = newUrl
      updates.upload_order = newOrder
    }

    const { data: updatedRow, error: updateError } = await service
      .from('daily_report_additional_photos')
      .update(updates)
      .eq('id', photoId)
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
      .maybeSingle()

    if (updateError || !updatedRow) {
      console.error('[admin/sites/photos][PATCH] update error:', updateError)
      if (updateError && isMissingAdditionalPhotosTableError(updateError)) {
        return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
      }
      return buildErrorResponse(updateError?.message || '사진 정보를 수정할 수 없습니다.', 500)
    }

    await aggregateAdditionalPhotos(photoRow.daily_report_id)

    let photo = mapPhotoRow(updatedRow as RawPhotoRow)
    ;[photo] = await withSignedPhotoUrls([photo])

    return NextResponse.json({
      success: true,
      data: photo,
    })
  } catch (error) {
    console.error('[admin/sites/photos][PATCH] unexpected error:', error)
    if (isMissingAdditionalPhotosTableError(error)) {
      return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return buildErrorResponse(message, 500)
  }
}

async function resequenceAndGetOrderOnMove(
  reportId: string,
  oldType: 'before' | 'after',
  newType: 'before' | 'after'
) {
  await resequenceUploadOrder(reportId, oldType)
  return getNextUploadOrder(reportId, newType)
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string; photoId: string } }
) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin'].includes(String(auth.role))) {
      return buildErrorResponse('Forbidden', 403)
    }

    const siteId = context.params.id
    const photoId = context.params.photoId

    const site = await fetchSiteRecord(siteId)
    if (!site) return buildErrorResponse('Site not found', 404)

    const tableStatus = await getAdditionalPhotosTableStatus()
    if (!tableStatus.ready) {
      return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
    }

    const photoRow = await fetchPhoto(photoId)
    if (!photoRow) return buildErrorResponse('Photo not found', 404)
    const report = photoRow.daily_reports || photoRow.daily_report || photoRow.report
    if (!report || report.site_id !== siteId) {
      return buildErrorResponse('Photo does not belong to this site', 403)
    }

    const service = createServiceClient()
    const variants = photoRow.file_path
      ? deriveVariantPathsFromStoredPath(photoRow.file_path)
      : {
          originalPath: photoRow.file_path,
          displayPath: photoRow.file_path,
          thumbPath: photoRow.file_path,
        }
    const removeList = Array.from(
      new Set(
        [
          photoRow.file_path,
          variants.originalPath,
          variants.displayPath,
          variants.thumbPath,
        ].filter(Boolean) as string[]
      )
    )

    const { error: storageError } = await service.storage.from('daily-reports').remove(removeList)
    if (storageError) {
      console.warn('[admin/sites/photos][DELETE] storage removal warning:', storageError)
    }

    const { error: deleteError } = await service
      .from('daily_report_additional_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('[admin/sites/photos][DELETE] delete error:', deleteError)
      if (isMissingAdditionalPhotosTableError(deleteError)) {
        return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
      }
      return buildErrorResponse(deleteError.message || '삭제에 실패했습니다.', 500)
    }

    await resequenceUploadOrder(photoRow.daily_report_id, photoRow.photo_type)
    await aggregateAdditionalPhotos(photoRow.daily_report_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/sites/photos][DELETE] unexpected error:', error)
    if (isMissingAdditionalPhotosTableError(error)) {
      return buildErrorResponse('사진 추가 테이블이 준비되지 않았습니다.', 503)
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return buildErrorResponse(message, 500)
  }
}
