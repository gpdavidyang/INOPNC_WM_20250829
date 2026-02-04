import { deleteDailyReport, updateDailyReport } from '@/app/actions/admin/daily-reports'
import {
  aggregateAdditionalPhotos,
  deriveVariantPathsFromStoredPath,
  resequenceUploadOrder,
} from '@/lib/admin/site-photos'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

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
      worker_entries: workerEntriesRaw,
      material_usage: materialUsageRaw,
      additional_photos: additionalPhotosRaw,
      work_entries: workEntriesRaw, // Currently handled via JSON or main table
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
    // Sync worker entries if provided
    if (Array.isArray(workerEntriesRaw)) {
      try {
        const service = createServiceClient()
        // Simple strategy: delete existing and re-insert
        await service.from('worker_assignments').delete().eq('daily_report_id', id)

        if (workerEntriesRaw.length > 0) {
          const insertRows = workerEntriesRaw.map((entry: any) => ({
            daily_report_id: id,
            profile_id: entry.worker_id || null, // Primary FK
            worker_id: entry.worker_id || null, // Alias column
            worker_name: entry.worker_name || '이름없음',
            labor_hours: Number(entry.labor_hours || entry.hours || 0),
            is_direct_input: entry.is_direct_input ?? !entry.worker_id,
            notes: entry.notes || null,
          }))
          const { error: insErr } = await service.from('worker_assignments').insert(insertRows)
          if (insErr) console.error('[admin/daily-reports:PATCH] worker insert error:', insErr)
        }
      } catch (err) {
        console.error('[admin/daily-reports:PATCH] sync workers failed:', err)
      }
    }

    // Sync material usage if provided
    if (Array.isArray(materialUsageRaw)) {
      try {
        const service = createServiceClient()
        // Simple strategy: delete existing and re-insert
        await service.from('material_usage').delete().eq('daily_report_id', id)

        if (materialUsageRaw.length > 0) {
          const insertRows = materialUsageRaw.map((entry: any) => ({
            daily_report_id: id,
            material_id: entry.material_id || null,
            material_code: entry.material_code || null,
            material_name: entry.material_name || '자재',
            material_type: String(
              entry.material_code || entry.material_name || 'ETC'
            ).toUpperCase(),
            quantity: Number(entry.quantity || 0),
            quantity_val: Number(entry.quantity || 0),
            amount: Number(entry.quantity || 0),
            unit: entry.unit || null,
            notes: entry.notes || null,
          }))
          const { error: insErr } = await service.from('material_usage').insert(insertRows)
          if (insErr) console.error('[admin/daily-reports:PATCH] material insert error:', insErr)

          // Try to trigger inventory update (not critical for admin but good for consistency)
          try {
            const baseUrl = req.nextUrl.origin
            await fetch(`${baseUrl}/api/mobile/daily-reports/${id}/materials/apply-usage`, {
              method: 'POST',
              headers: {
                Cookie: req.headers.get('cookie') || '',
              },
            }).catch(() => null)
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error('[admin/daily-reports:PATCH] sync materials failed:', err)
      }
    }

    // NEW: Sync work_content JSON for cross-platform compatibility (mobile app uses this)
    try {
      const service = createServiceClient()
      const { data: current } = await service
        .from('daily_reports')
        .select('work_content')
        .eq('id', id)
        .single()

      if (current) {
        let workContent = current.work_content
        if (typeof workContent === 'string') {
          try {
            workContent = JSON.parse(workContent)
          } catch (e) {
            workContent = {}
          }
        }
        if (!workContent || typeof workContent !== 'object') workContent = {}

        // Update materials and workers inside the JSON
        if (Array.isArray(materialUsageRaw)) {
          workContent.materials = materialUsageRaw.map(m => ({
            material_id: m.material_id,
            materialId: m.material_id,
            material_code: m.material_code,
            materialCode: m.material_code,
            material_name: m.material_name,
            materialName: m.material_name,
            quantity: m.quantity,
            unit: m.unit,
            notes: m.notes,
          }))
        }
        if (Array.isArray(workerEntriesRaw)) {
          workContent.workers = workerEntriesRaw.map(w => ({
            id: w.worker_id,
            worker_id: w.worker_id,
            workerId: w.worker_id,
            name: w.worker_name,
            worker_name: w.worker_name,
            hours: Number(w.labor_hours || w.hours || 0) * 8,
          }))
        }
        if (Array.isArray(workEntriesRaw)) {
          workContent.tasks = workEntriesRaw
        }

        await service.from('daily_reports').update({ work_content: workContent }).eq('id', id)
      }
    } catch (err) {
      console.warn('[admin/daily-reports:PATCH] sync work_content failed:', err)
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
          // Non-critical, but log it
        } else {
          const existingRows = existingRowsRaw || []
          const incomingById = new Map(incomingExisting.map(p => [String(p.id), p]))

          // Deletions: DB rows not present in incoming
          const toDelete = existingRows.filter(r => !incomingById.has(String(r.id)))
          for (const row of toDelete) {
            try {
              if (row.file_path) {
                const variants = deriveVariantPathsFromStoredPath(row.file_path)
                const removeList = Array.from(
                  new Set([
                    row.file_path,
                    variants.originalPath,
                    variants.displayPath,
                    variants.thumbPath,
                  ])
                )
                await service.storage.from('daily-reports').remove(removeList)
              }
              await service.from('daily_report_additional_photos').delete().eq('id', row.id)
            } catch (e) {
              console.error('[admin/daily-reports:PATCH] photo delete exception:', e)
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

            await service
              .from('daily_report_additional_photos')
              .update({
                photo_type: desiredType,
                description: desiredDesc || null,
                upload_order: desiredOrder,
              })
              .eq('id', ex.id)
          }

          // Resequence and aggregate to keep consistency
          await resequenceUploadOrder(id, 'before')
          await resequenceUploadOrder(id, 'after')
          await aggregateAdditionalPhotos(id)
        }
      } catch (err) {
        console.error('[admin/daily-reports:PATCH] sync additional photos failed:', err)
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
