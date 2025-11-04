import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, ctx: { params: { id: string } }) {
  const supabase = createClient()
  try {
    const idOrCode = ctx.params.id
    const body = await request.json()
    const update: Record<string, any> = {}

    if (body.label !== undefined) update.label = body.label

    if (body.stageRequired && typeof body.stageRequired === 'object') {
      if ('start' in body.stageRequired) {
        update.is_required_start = !!body.stageRequired.start
      }
      if ('progress' in body.stageRequired) {
        update.is_required_progress = !!body.stageRequired.progress
      }
      if ('completion' in body.stageRequired) {
        update.is_required_completion = !!body.stageRequired.completion
      }
    }

    if (body.allowMultipleVersions !== undefined) {
      update.allow_multiple_versions = body.allowMultipleVersions !== false
    }

    if (body.allowedMimeTypes !== undefined) {
      update.allowed_mime_types = body.allowedMimeTypes || null
    }

    if (body.sortOrder !== undefined) {
      update.sort_order = Number(body.sortOrder)
    }

    if (body.isActive !== undefined) {
      update.is_active = !!body.isActive
    }

    if (body.code !== undefined) {
      update.code = body.code
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true })
    }

    let q = supabase.from('invoice_document_types').update(update)
    // 지원: id(uuid) 또는 code로 업데이트
    if (/^[0-9a-fA-F-]{36}$/.test(idOrCode)) q = q.eq('id', idOrCode)
    else q = q.eq('code', idOrCode)

    const { error } = await q
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'Types registry not available (provision needed)' },
      { status: 501 }
    )
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: { id: string } }) {
  const supabase = createClient()
  try {
    const idOrCode = ctx.params.id
    const column = /^[0-9a-fA-F-]{36}$/.test(idOrCode) ? 'id' : 'code'
    const { error } = await supabase.from('invoice_document_types').delete().eq(column, idOrCode)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'Types registry not available (provision needed)' },
      { status: 501 }
    )
  }
}
