import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(_request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    const id = ctx.params.id
    const { data: sheet, error } = await supabase
      .from('photo_sheets')
      .select('*, site:sites!photo_sheets_site_id_fkey (id, name, organization_id)')
      .eq('id', id)
      .single()

    if (error || !sheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (auth.isRestricted) {
      const org = (sheet as any).site?.organization_id
      if (!(await canAccessData(auth, org)))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const service = createServiceClient()
    const { data: items, error: itemsError } = await service
      .from('photo_sheet_items')
      .select('*')
      .eq('photosheet_id', id)
      .order('item_index', { ascending: true })
    if (itemsError) {
      const msg = itemsError.message || String(itemsError)
      console.error('Fetch photo_sheet_items error:', msg)
      return NextResponse.json(
        { error: '사진대지 항목을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      )
    }

    const hydratedItems = await ensureFreshPhotoSheetUrls(id, items || [], service)

    return NextResponse.json({ success: true, data: { ...sheet, items: hydratedItems } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/photo-sheets/[id] exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    const id = ctx.params.id
    const supabase = await createClient()

    // Load sheet to check access/site
    const { data: sheet, error: loadErr } = await supabase
      .from('photo_sheets')
      .select('*, site:sites!photo_sheets_site_id_fkey (id, organization_id)')
      .eq('id', id)
      .single()
    if (loadErr || !sheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const orgId = (sheet as any).site?.organization_id
    if (!(await canAccessData(auth, orgId)))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const form = await request.formData()
    const patch: Record<string, any> = {}
    const isMissingSourceColumns = (message?: string) =>
      !!message && /source_daily_report/i.test(message)

    if (form.has('title')) patch.title = String(form.get('title') || '')
    if (form.has('orientation')) patch.orientation = String(form.get('orientation'))
    if (form.has('rows')) patch.rows = Number(form.get('rows'))
    if (form.has('cols')) patch.cols = Number(form.get('cols'))
    if (form.has('status')) patch.status = String(form.get('status'))
    if (form.has('site_id')) patch.site_id = String(form.get('site_id'))

    let newSourceReportId: string | null | undefined = undefined
    if (form.has('source_daily_report_id')) {
      const raw = String(form.get('source_daily_report_id') || '').trim()
      newSourceReportId = raw || null
    }
    let newSourceSummary: string | null | undefined = undefined
    if (form.has('source_daily_report_summary')) {
      const raw = String(form.get('source_daily_report_summary') || '').trim()
      newSourceSummary = raw || null
    }

    if (newSourceReportId !== undefined) {
      if (newSourceReportId) {
        const { data: linkedReport, error: linkedErr } = await supabase
          .from('daily_reports')
          .select('id, site_id, work_date, component_name, process_type')
          .eq('id', newSourceReportId)
          .maybeSingle()
        if (linkedErr || !linkedReport) {
          return NextResponse.json({ error: '존재하지 않는 작업일지입니다.' }, { status: 400 })
        }
        if (patch.site_id && patch.site_id !== linkedReport.site_id) {
          return NextResponse.json(
            { error: '선택한 작업일지가 변경된 현장과 일치하지 않습니다.' },
            { status: 400 }
          )
        }
        if (!patch.site_id && linkedReport.site_id !== (sheet as any).site?.id) {
          return NextResponse.json(
            { error: '선택한 작업일지가 해당 현장과 일치하지 않습니다.' },
            { status: 400 }
          )
        }
        patch.source_daily_report_id = newSourceReportId
        if (!newSourceSummary) {
          const parts: string[] = []
          if (linkedReport.work_date) {
            try {
              parts.push(
                new Date(linkedReport.work_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
              )
            } catch {
              parts.push(linkedReport.work_date)
            }
          }
          if (linkedReport.component_name) parts.push(linkedReport.component_name)
          if (linkedReport.process_type) parts.push(linkedReport.process_type)
          patch.source_daily_report_summary = parts.join(' / ')
        }
      } else {
        patch.source_daily_report_id = null
        if (newSourceSummary !== undefined) {
          patch.source_daily_report_summary = newSourceSummary
        }
      }
    }

    if (newSourceReportId === undefined && newSourceSummary !== undefined) {
      patch.source_daily_report_summary = newSourceSummary
    }

    if (Object.keys(patch).length) {
      const db =
        auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase
      const attemptUpdate = async (payload: Record<string, any>) =>
        db.from('photo_sheets').update(payload).eq('id', id)
      let { error: upErr } = await attemptUpdate(patch)
      if (upErr && isMissingSourceColumns(upErr.message)) {
        const fallbackPatch = { ...patch }
        delete fallbackPatch.source_daily_report_id
        delete fallbackPatch.source_daily_report_summary
        const fallback = await attemptUpdate(fallbackPatch)
        upErr = fallback.error
      }
      if (upErr) {
        console.error('Update sheet error:', upErr)
        return NextResponse.json(
          { error: upErr.message || 'Failed to update sheet' },
          { status: 500 }
        )
      }
    }

    // Items handling
    const itemsRaw = form.get('items') as string | null
    let items: any[] = []
    if (itemsRaw) {
      try {
        items = JSON.parse(itemsRaw)
      } catch {
        items = []
      }
    }

    const service = createServiceClient()
    if (items.length) {
      // Replace strategy: delete existing, insert new snapshot
      const { error: delErr } = await supabase
        .from('photo_sheet_items')
        .delete()
        .eq('photosheet_id', id)
      if (delErr) console.warn('Delete existing items failed (continuing):', delErr)

      const rows: any[] = []
      for (let i = 0; i < items.length; i++) {
        const it = items[i] || {}
        const index = Number(it.index ?? i)
        const file = form.get(`file_${index}`) as File | null
        let image_url: string | null = null
        if (file) {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const ext = (file.type?.split('/')?.[1] || 'jpg').toLowerCase()
          const path = `photosheets/${id}/${index}.${ext}`
          const { error: upErr } = await service.storage
            .from('documents')
            .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: true })
          if (upErr) throw new Error(`upload failed: ${upErr.message}`)
          const { data: pub } = service.storage.from('documents').getPublicUrl(path)
          image_url = pub.publicUrl
        } else if (it.image_url) {
          image_url = String(it.image_url)
        }
        rows.push({
          photosheet_id: id,
          item_index: index,
          member_name: it.member ?? null,
          process_name: it.process ?? null,
          content: it.content ?? null,
          stage: it.stage ?? null,
          image_url,
          width: it.width ?? null,
          height: it.height ?? null,
          mime: file?.type || it.mime || null,
        })
      }

      if (rows.length) {
        const { error: insErr } = await supabase.from('photo_sheet_items').insert(rows)
        if (insErr) console.error('Insert new items error:', insErr)
      }
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('PUT /api/photo-sheets/[id] exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

type SupabaseServiceClient = ReturnType<typeof createServiceClient>
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 // 24 hours is enough for preview sessions
const SUPABASE_OBJECT_PREFIX = '/storage/v1/object/'
const CLONE_BUCKETS = new Set(['daily-reports', 'daily-report-photos'])

type ParsedStorageTarget = {
  bucket: string
  path: string
  access: 'sign' | 'public'
}

function parseSupabaseStorageUrl(raw?: string | null): ParsedStorageTarget | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const url = new URL(raw)
    const idx = url.pathname.indexOf(SUPABASE_OBJECT_PREFIX)
    if (idx === -1) return null
    const rest = url.pathname.slice(idx + SUPABASE_OBJECT_PREFIX.length)
    const slashIdx = rest.indexOf('/')
    if (slashIdx === -1) return null
    const accessType = rest.slice(0, slashIdx)
    const access: ParsedStorageTarget['access'] =
      accessType === 'sign' ? 'sign' : accessType === 'public' ? 'public' : null
    if (!access) return null
    const pathPart = rest.slice(slashIdx + 1)
    const questionIndex = pathPart.indexOf('?')
    const withoutQuery = questionIndex === -1 ? pathPart : pathPart.slice(0, questionIndex)
    const [bucket, ...segments] = withoutQuery.split('/')
    if (!bucket || segments.length === 0) return null
    const normalizedPath = decodeURIComponent(segments.join('/'))
    return { bucket, path: normalizedPath, access }
  } catch {
    return null
  }
}

async function cloneDailyReportPhotoToDocuments(options: {
  sheetId: string
  item: {
    id?: string
    item_index?: number | null
    image_url?: string | null
    mime?: string | null
  }
  target: ParsedStorageTarget
  service: SupabaseServiceClient
}) {
  const { sheetId, item, target, service } = options
  if (!CLONE_BUCKETS.has(target.bucket)) return null
  try {
    const download = await service.storage.from(target.bucket).download(target.path)
    if (download.error || !download.data) {
      console.warn('[photo-sheets] Failed to download original photo:', download.error)
      return null
    }
    const arrayBuffer = await download.data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = (path.extname(target.path).replace('.', '') || 'jpg').toLowerCase()
    const normalizedExt = ext.length >= 3 && ext.length <= 4 ? ext : 'jpg'
    const storagePath = `photosheets/${sheetId}/${String(item.item_index ?? 0)}.${normalizedExt}`
    const inferredMime =
      item.mime && item.mime.startsWith('image/')
        ? item.mime
        : normalizedExt === 'jpg'
          ? 'image/jpeg'
          : `image/${normalizedExt}`
    const { error: uploadErr } = await service.storage
      .from('documents')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: inferredMime,
      })
    if (uploadErr) {
      console.error('[photo-sheets] Failed to clone photo to documents bucket:', uploadErr)
      return null
    }
    const { data: pub } = service.storage.from('documents').getPublicUrl(storagePath)
    if (!pub?.publicUrl) return null
    if (item.id) {
      await service.from('photo_sheet_items').update({ image_url: pub.publicUrl }).eq('id', item.id)
    }
    return pub.publicUrl
  } catch (error) {
    console.error('[photo-sheets] cloneDailyReportPhotoToDocuments error:', error)
    return null
  }
}

async function ensureFreshPhotoSheetUrls(
  sheetId: string,
  items: Array<{
    id?: string
    item_index?: number | null
    image_url?: string | null
    mime?: string | null
  }>,
  service: SupabaseServiceClient
) {
  if (!items || items.length === 0) return items
  const cache = new Map<string, string>()
  for (const item of items) {
    if (!item?.image_url) continue
    const target = parseSupabaseStorageUrl(item.image_url)
    if (!target) continue

    if (CLONE_BUCKETS.has(target.bucket)) {
      const cloned = await cloneDailyReportPhotoToDocuments({ sheetId, item, target, service })
      if (cloned) {
        item.image_url = cloned
        continue
      }
    }

    const needsSigned =
      target.access === 'sign' || (target.access === 'public' && CLONE_BUCKETS.has(target.bucket))
    if (!needsSigned) {
      continue
    }
    const cacheKey = `${target.bucket}/${target.path}`
    let refreshed = cache.get(cacheKey)
    if (!refreshed) {
      const { data, error } = await service.storage
        .from(target.bucket)
        .createSignedUrl(target.path, SIGNED_URL_TTL_SECONDS)
      if (error || !data?.signedUrl) {
        console.warn('[photo-sheets] Failed to refresh signed URL:', error?.message || error)
        cache.set(cacheKey, item.image_url)
        continue
      }
      refreshed = data.signedUrl
      cache.set(cacheKey, refreshed)
    }
    if (refreshed) {
      item.image_url = refreshed
    }
  }
  return items
}

export async function DELETE(_request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult
    const id = ctx.params.id
    const supabase = await createClient()

    const { data: sheet, error: loadErr } = await supabase
      .from('photo_sheets')
      .select('*, site:sites(id, organization_id)')
      .eq('id', id)
      .single()
    if (loadErr || !sheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const orgId = (sheet as any).site?.organization_id
    if (!(await canAccessData(auth, orgId)))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db =
      auth.role === 'admin' || auth.role === 'system_admin' ? createServiceClient() : supabase
    const { error: delErr } = await db.from('photo_sheets').delete().eq('id', id)
    if (delErr) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('DELETE /api/photo-sheets/[id] exception:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}
