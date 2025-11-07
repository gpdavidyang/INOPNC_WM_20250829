import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { updateDailyReport, deleteDailyReport } from '@/app/actions/admin/daily-reports'
import { createServiceClient } from '@/lib/supabase/service'
import { aggregateAdditionalPhotos, resequenceUploadOrder } from '@/lib/admin/site-photos'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/daily-reports/:id
// Guards: duplicate site_id+work_date when updated
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const id = params.id
    const updatesRaw = await req.json().catch(() => ({}))
    const {
      worker_entries: workerEntriesUnused,
      material_usage: materialUsageUnused,
      additional_photos: additionalPhotosRaw,
      work_entries: workEntriesUnused,
      ...updates
    } = updatesRaw || {}

    const siteId = String(updates?.site_id || '').trim()
    const workDate = String(updates?.work_date || updates?.report_date || '').trim()
    if (siteId && workDate) {
      const supabase = createClient()
      const { data: dup } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('site_id', siteId)
        .eq('work_date', workDate)
        .neq('id', id)
        .maybeSingle()
      if (dup?.id) {
        return NextResponse.json(
          {
            success: false,
            error: '동일한 현장과 일자의 작업일지가 이미 존재합니다.',
            existing_id: dup.id,
          },
          { status: 409 }
        )
      }
    }

    const result = await updateDailyReport(id, updates)
    if (!result.success) {
      console.error('[admin/daily-reports:PATCH] update failed', {
        id,
        payload: updates,
        error: result.error,
      })
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    // Sync additional photos if provided
    if (Array.isArray(additionalPhotosRaw)) {
      try {
        type IncomingPhoto = {
          id?: string
          photo_type?: 'before' | 'after' | string | null
          description?: string | null
          upload_order?: number | null
          path?: string | null
          storage_path?: string | null
          url?: string | null
          filename?: string | null
        }

        const incomingAll: IncomingPhoto[] = (additionalPhotosRaw as IncomingPhoto[]).filter(
          Boolean
        )

        // Only consider existing photos with a stable id; ignore temp/new files (file upload not supported here)
        const incomingExisting = incomingAll.filter(p => p.id && !String(p.id).startsWith('temp'))

        const service = createServiceClient()
        const { data: existingRowsRaw, error: existingErr } = await service
          .from('daily_report_additional_photos')
          .select('id, file_path, photo_type, upload_order, description')
          .eq('daily_report_id', id)
        if (existingErr) {
          console.error('[admin/daily-reports:PATCH] fetch existing photos failed:', existingErr)
          return NextResponse.json(
            { success: false, error: '추가 사진 정보를 불러오지 못했습니다.' },
            { status: 500 }
          )
        }

        const existingRows = existingRowsRaw || []
        const incomingById = new Map(incomingExisting.map(p => [String(p.id), p]))

        // Deletions: DB rows not present in incoming
        const toDelete = existingRows.filter(r => !incomingById.has(String(r.id)))
        for (const row of toDelete) {
          try {
            if (row.file_path) {
              const { error: storageError } = await service.storage
                .from('daily-reports')
                .remove([row.file_path])
              if (storageError) {
                console.warn('[admin/daily-reports:PATCH] storage remove warning:', storageError)
              }
            }
            const { error: delErr } = await service
              .from('daily_report_additional_photos')
              .delete()
              .eq('id', row.id)
            if (delErr) {
              console.error('[admin/daily-reports:PATCH] photo delete error:', delErr)
              return NextResponse.json(
                { success: false, error: '추가 사진 삭제에 실패했습니다.' },
                { status: 500 }
              )
            }
          } catch (e) {
            console.error('[admin/daily-reports:PATCH] photo delete exception:', e)
            return NextResponse.json(
              { success: false, error: '추가 사진 삭제 중 오류가 발생했습니다.' },
              { status: 500 }
            )
          }
        }

        // Updates: normalize incoming order per type and update changed fields
        const normalizeType = (t: any): 'before' | 'after' =>
          String(t).toLowerCase() === 'after' ? 'after' : 'before'

        const incomingBefore = incomingExisting
          .filter(p => normalizeType(p.photo_type) === 'before')
          .map((p, idx) => ({ ...p, upload_order: idx + 1, photo_type: 'before' as const }))
        const incomingAfter = incomingExisting
          .filter(p => normalizeType(p.photo_type) === 'after')
          .map((p, idx) => ({ ...p, upload_order: idx + 1, photo_type: 'after' as const }))

        const planned = [...incomingBefore, ...incomingAfter]
        const existingById = new Map(existingRows.map(r => [String(r.id), r]))

        for (const p of planned) {
          const ex = existingById.get(String(p.id))
          if (!ex) continue
          const desiredType = normalizeType(p.photo_type)
          const desiredDesc = (p.description || '').trim()
          const desiredOrder = Number(p.upload_order) || ex.upload_order

          const needsType = desiredType !== ex.photo_type
          const needsDesc = (ex.description || '') !== desiredDesc
          const needsOrder = desiredOrder !== ex.upload_order
          if (!needsType && !needsDesc && !needsOrder) continue

          const { error: updErr } = await service
            .from('daily_report_additional_photos')
            .update({
              photo_type: desiredType,
              description: desiredDesc || null,
              upload_order: desiredOrder,
            })
            .eq('id', ex.id)
          if (updErr) {
            console.error('[admin/daily-reports:PATCH] photo update error:', updErr)
            return NextResponse.json(
              { success: false, error: '추가 사진 수정에 실패했습니다.' },
              { status: 500 }
            )
          }
        }

        // Resequence and aggregate to keep consistency
        await resequenceUploadOrder(id, 'before')
        await resequenceUploadOrder(id, 'after')
        await aggregateAdditionalPhotos(id)
      } catch (err) {
        console.error('[admin/daily-reports:PATCH] sync additional photos failed:', err)
        return NextResponse.json(
          { success: false, error: '추가 사진 동기화에 실패했습니다.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (e) {
    console.error('[admin/daily-reports:PATCH] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/daily-reports/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const id = params.id
    const result = await deleteDailyReport(id)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch (e) {
    console.error('[admin/daily-reports:DELETE] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
