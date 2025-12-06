import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { deriveVariantPathsFromStoredPath } from '@/lib/admin/site-photos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const photoId = params.id
    if (!photoId) {
      return NextResponse.json({ error: 'photo id required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: row, error: fetchErr } = await supabase
      .from('daily_report_additional_photos')
      .select('id,file_path,file_url')
      .eq('id', photoId)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    const filePath = (row as any).file_path as string | null

    try {
      const svc = createServiceClient()
      if (filePath) {
        const variants = deriveVariantPathsFromStoredPath(filePath)
        const removeList = Array.from(
          new Set([filePath, variants.originalPath, variants.displayPath, variants.thumbPath])
        )
        await (svc as any).storage.from('daily-reports').remove(removeList)
      }
    } catch (storageErr) {
      console.warn('[media/photos/delete] storage remove skipped:', storageErr)
    }

    const { error: deleteErr } = await supabase
      .from('daily_report_additional_photos')
      .delete()
      .eq('id', photoId)
    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[media/photos/delete] unexpected', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const photoId = params.id
    if (!photoId) {
      return NextResponse.json({ error: 'photo id required' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const targetType = body?.photo_type as string
    if (!targetType || (targetType !== 'before' && targetType !== 'after')) {
      return NextResponse.json({ error: 'invalid photo_type' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: row, error: fetchErr } = await supabase
      .from('daily_report_additional_photos')
      .select('id,daily_report_id,photo_type')
      .eq('id', photoId)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    if ((row as any).photo_type === targetType) {
      return NextResponse.json({ success: true, updated: false })
    }

    // place to last order of target type
    const { data: lastRows } = await supabase
      .from('daily_report_additional_photos')
      .select('upload_order')
      .eq('daily_report_id', (row as any).daily_report_id)
      .eq('photo_type', targetType)
      .order('upload_order', { ascending: false })
      .limit(1)

    const nextOrder = lastRows && lastRows.length ? Number(lastRows[0].upload_order) + 1 : 1

    const { error: updateErr } = await supabase
      .from('daily_report_additional_photos')
      .update({ photo_type: targetType, upload_order: nextOrder })
      .eq('id', photoId)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true, updated: true })
  } catch (error) {
    console.error('[media/photos/patch] unexpected', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
