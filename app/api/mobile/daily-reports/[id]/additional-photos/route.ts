import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildVariantStoragePaths, generateImageVariants } from '@/lib/admin/site-photos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const reportId = params.id
    if (!reportId) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400 })
    }

    const form = await request.formData()
    const beforeFiles = form.getAll('before_photos') as File[]
    const afterFiles = form.getAll('after_photos') as File[]

    if (beforeFiles.length === 0 && afterFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const supabase = createClient()
    let svc: ReturnType<typeof createServiceClient> | ReturnType<typeof createClient>
    try {
      svc = createServiceClient()
    } catch {
      svc = supabase
    }

    let uploaded = 0
    const errors: string[] = []

    const uploadSet = async (files: File[], type: 'before' | 'after') => {
      // Fetch last order and current count to enforce 30 limit
      const { data: lastRows } = await supabase
        .from('daily_report_additional_photos')
        .select('upload_order')
        .eq('daily_report_id', reportId)
        .eq('photo_type', type)
        .order('upload_order', { ascending: false })
        .limit(1)
      const { count: currentCount } = await supabase
        .from('daily_report_additional_photos')
        .select('id', { count: 'exact', head: true })
        .eq('daily_report_id', reportId)
        .eq('photo_type', type)
      const MAX_PER_TYPE = 30
      const available = Math.max(0, MAX_PER_TYPE - (currentCount || 0))
      const toUpload = files.slice(0, available)
      if (available === 0) {
        errors.push(`'${type}'는 최대 ${MAX_PER_TYPE}장까지 가능합니다.`)
        return
      }
      if (toUpload.length < files.length) {
        errors.push(`'${type}' 추가 가능 수량: ${available}장 (요청 ${files.length}장)`)
      }
      let order = lastRows && lastRows.length ? Number(lastRows[0].upload_order) : 0

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i]
        try {
          const arrayBuffer = await file.arrayBuffer()
          // @ts-ignore - Buffer available in node runtime
          const buffer = Buffer.from(arrayBuffer)
          order += 1

          const paths = buildVariantStoragePaths(reportId, type, file.name)
          const { displayBuffer, thumbBuffer } = await generateImageVariants(buffer)

          // Original
          const { error: origErr } = await (svc as any).storage
            .from('daily-reports')
            .upload(paths.originalPath, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: false,
            })
          if (origErr) throw origErr

          // Display (1280w)
          const { error: displayErr } = await (svc as any).storage
            .from('daily-reports')
            .upload(paths.displayPath, displayBuffer, {
              contentType: 'image/jpeg',
              upsert: false,
            })
          if (displayErr) throw displayErr

          // Thumb (400w)
          const { error: thumbErr } = await (svc as any).storage
            .from('daily-reports')
            .upload(paths.thumbPath, thumbBuffer, {
              contentType: 'image/jpeg',
              upsert: false,
            })
          if (thumbErr) throw thumbErr

          const {
            data: { publicUrl: displayUrl },
          } = (svc as any).storage.from('daily-reports').getPublicUrl(paths.displayPath)
          const {
            data: { publicUrl: thumbUrl },
          } = (svc as any).storage.from('daily-reports').getPublicUrl(paths.thumbPath)

          const { error: dbErr } = await (svc as any)
            .from('daily_report_additional_photos')
            .insert({
              daily_report_id: reportId,
              photo_type: type,
              file_url: displayUrl,
              file_path: paths.originalPath,
              file_name: file.name,
              file_size: file.size,
              description: '',
              upload_order: order,
              uploaded_by: authResult.userId,
            })
          if (dbErr) throw dbErr
          uploaded += 1
        } catch (e: any) {
          errors.push(`${file.name}: ${e?.message || 'upload failed'}`)
        } finally {
          // no-op
        }
      }
    }

    await uploadSet(beforeFiles, 'before')
    await uploadSet(afterFiles, 'after')

    return NextResponse.json({
      success: true,
      uploaded,
      errors: errors.length ? errors : undefined,
    })
  } catch (error) {
    console.error('additional-photos upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
