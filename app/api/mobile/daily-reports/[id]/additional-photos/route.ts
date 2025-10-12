import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function sanitizeFilename(filename: string): string {
  const ext = filename.split('.').pop() || 'jpg'
  const base = filename
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
  return base || `photo.${ext}`
}

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

    async function uploadSet(files: File[], type: 'before' | 'after') {
      // Fetch last order
      const { data: lastRows } = await supabase
        .from('daily_report_additional_photos')
        .select('upload_order')
        .eq('daily_report_id', reportId)
        .eq('photo_type', type)
        .order('upload_order', { ascending: false })
        .limit(1)
      let order = lastRows && lastRows.length ? Number(lastRows[0].upload_order) : 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const arrayBuffer = await file.arrayBuffer()
          // @ts-ignore - Buffer available in node runtime
          const buffer = Buffer.from(arrayBuffer)
          order += 1
          const sanitized = sanitizeFilename(file.name)
          const path = `daily-reports/${reportId}/additional/${type}/${Date.now()}_${order}_${sanitized}`
          const { error: upErr } = await (svc as any).storage
            .from('daily-reports')
            .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: false })
          if (upErr) throw upErr
          const {
            data: { publicUrl },
          } = (svc as any).storage.from('daily-reports').getPublicUrl(path)
          const { error: dbErr } = await (svc as any)
            .from('daily_report_additional_photos')
            .insert({
              daily_report_id: reportId,
              photo_type: type,
              file_url: publicUrl,
              file_path: path,
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
        }
      }
    }

    await uploadSet(beforeFiles, 'before')
    await uploadSet(afterFiles, 'after')

    return NextResponse.json({ success: true, uploaded, errors: errors.length ? errors : undefined })
  } catch (error) {
    console.error('additional-photos upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
